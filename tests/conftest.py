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
from inspect import iscoroutinefunction

# External imports
import _pytest
import pandas as pd
import pytest
from narwhals.stable.v1.typing import IntoDataFrame

pandas_1x = pd.__version__.startswith("1")

def pytest_collection_modifyitems(items: list[_pytest.nodes.Item]) -> None:
    for item in items:
        if iscoroutinefunction(item.obj):
            item.add_marker(pytest.mark.asyncio)

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


constructors = [pandas_constructor]

if not pandas_1x:
    constructors.append(pandas_nullable_constructor)
if importlib.util.find_spec('pyarrow') is not None:
    constructors.extend([pandas_pyarrow_constructor, pyarrow_table_constructor])
if importlib.util.find_spec('polars') is not None:
    constructors.append(polars_eager_constructor)


@pytest.fixture(params=constructors)
def constructor(request: pytest.FixtureRequest):
    return request.param  # type: ignore[no-any-return]
