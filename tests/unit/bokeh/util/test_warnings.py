#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import sys

import pytest

from bokeh.core.properties import DeprecatedAlias, Int, NumberSpec
from bokeh.io.export import _resolve_backend
from bokeh.model import Model
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure


@pytest.mark.parametrize(("method", "kwargs", "replacement"), [
    ("circle", {"size": 10}, "scatter(size=...)"),
    ("scatter", {"radius": 1}, "circle(radius=...)"),
])
def test_conditional_marker_warning(method: str, kwargs: dict[str, int], replacement: str) -> None:
    plot = figure()
    with pytest.warns(DeprecationWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        getattr(plot, method)([1], [2], **kwargs)

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    assert replacement in str(warnings[0].message)


@pytest.mark.parametrize("option", ["accept_datetime", "accept_timedelta"])
def test_conditional_number_spec_warning(option: str) -> None:
    with pytest.warns(DeprecationWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        NumberSpec(**{option: False})

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    assert f"{option}=False" in str(warnings[0].message)
    assert "Bokeh 3.7.0" in str(warnings[0].message)


@pytest.mark.parametrize("write", [False, True])
@pytest.mark.parametrize("extra", [None, "  Additional migration advice.  "])
def test_deprecated_alias_warning(write: bool, extra: str | None) -> None:
    class _Example(Model):
        value = Int()
        old_value = DeprecatedAlias("value", since=(3, 1, 0), extra=extra)

    obj = _Example()
    with pytest.warns(DeprecationWarning) as warnings:
        if write:
            line = sys._getframe().f_lineno + 1
            obj.old_value = 10
        else:
            line = sys._getframe().f_lineno + 1
            assert obj.old_value == 0

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    message = "'old_value' was deprecated in Bokeh 3.1.0 and will be removed, use 'value' instead."
    if extra is not None:
        message += " " + extra.strip()
    assert str(warnings[0].message) == message


def test_nested_model_warning() -> None:
    with pytest.warns(UserWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        ColumnDataSource(data={"x": [1], "y": [1, 2]})

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    assert "columns must be of the same length" in str(warnings[0].message)


def test_selenium_backend_warning() -> None:
    with pytest.warns(DeprecationWarning) as warnings:
        line = sys._getframe().f_lineno + 1
        _resolve_backend(driver=None, backend="selenium")

    assert len(warnings) == 1
    assert warnings[0].filename == __file__
    assert warnings[0].lineno == line
    assert "deprecated in Bokeh 4.0.0" in str(warnings[0].message)
