#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

pytest_plugins = (
    "tests.support.plugins.ipython",
    "tests.support.plugins.managed_server_loop",
    "tests.support.plugins.networkx",
)

# Standard library imports
import importlib
import importlib.util
import sys
import sysconfig
from collections.abc import Iterator

# External imports
import _pytest
import pytest
from narwhals.stable.v1.typing import IntoDataFrame

if importlib.util.find_spec("pandas") is not None:
    import pandas as pd
    pandas_1x = pd.__version__.startswith("1")
else:
    pd = pandas_1x = None

# Unfortunately these seem to all need to be centrally defined at the top level
def pytest_addoption(parser: _pytest.config.argparsing.Parser) -> None:

    # plugins/selenium
    parser.addoption(
        "--driver", choices=('chrome', 'firefox', 'safari'), default='chrome', help='webdriver implementation')

    # plugins/bokeh_server
    parser.addoption(
        "--bokeh-port", dest="bokeh_port", type=int, default=5006, help="port on which Bokeh server resides",
    )

    # plugins/jupyter_notebook
    parser.addoption(
        "--notebook-port", type=int, default=6007, help="port on which Jupyter Notebook server resides",
    )

    parser.addoption(
        "--examples-log-file", dest="log_file", metavar="path", action="store", default='examples.log', help="where to write the complete log",
    )
    parser.addoption(
        "--no-js", action="store_true", default=False,
        help="only run python code and skip js")

def pandas_constructor(obj) -> IntoDataFrame:
    return pd.DataFrame(obj)  # type: ignore[no-any-return]


def pandas_nullable_constructor(obj) -> IntoDataFrame:
    return pd.DataFrame(obj).convert_dtypes(dtype_backend="numpy_nullable")  # type: ignore[no-any-return]


def pandas_pyarrow_constructor(obj) -> IntoDataFrame:
    return pd.DataFrame(obj).convert_dtypes(dtype_backend="pyarrow")  # type: ignore[no-any-return]


def polars_eager_constructor(obj) -> IntoDataFrame:
    import polars as pl
    return pl.DataFrame(obj)


def pyarrow_table_constructor(obj) -> IntoDataFrame:
    import pyarrow as pa
    return pa.table(obj)  # type: ignore[no-any-return]


constructors = []
if pandas_1x is False:
    constructors.append(pandas_constructor)
    constructors.append(pandas_nullable_constructor)
elif pandas_1x is True:
    constructors.append(pandas_constructor)

if pd and importlib.util.find_spec('pyarrow') is not None:
    constructors.extend([pandas_pyarrow_constructor, pyarrow_table_constructor])
if importlib.util.find_spec('polars') is not None:
    constructors.append(polars_eager_constructor)


def _assert_gil_disabled() -> None:
    assert sysconfig.get_config_var("Py_GIL_DISABLED") == 1
    is_gil_enabled = getattr(sys, "_is_gil_enabled", None)
    assert is_gil_enabled is not None
    assert not is_gil_enabled()


@pytest.fixture(scope="session", autouse=True)
def ensure_gil_disabled() -> Iterator[None]:
    required = sysconfig.get_config_var("Py_GIL_DISABLED") == 1
    if required:
        _assert_gil_disabled()

    yield

    if required:
        _assert_gil_disabled()


@pytest.fixture(params=constructors)
def constructor(request: pytest.FixtureRequest):
    return request.param  # type: ignore[no-any-return]


@pytest.fixture(scope="session")
def base_url() -> None:
    '''Session-scoped no-op override to prevent a fixture scope conflict.

    ``pytest-base-url`` (pulled in by ``pytest-playwright``) ships a
    session-scoped autouse ``_verify_url`` fixture that depends on
    ``base_url``.  ``pytest-tornado`` also defines ``base_url`` but at
    function scope.  When both plugins are installed, pytest raises
    ``ScopeMismatch``.  This override short-circuits the resolution:
    returning ``None`` causes ``_verify_url`` to skip its check, and no
    Bokeh test actually consumes the ``base_url`` fixture.
    '''
    return None
