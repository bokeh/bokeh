#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

import sys

import pytest

from bokeh.core.properties import DeprecatedAlias, Int
from bokeh.model import Model
from bokeh.models import ColumnDataSource


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
