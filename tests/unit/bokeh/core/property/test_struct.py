#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from types import SimpleNamespace

# Bokeh imports
from bokeh.core.properties import (
    Dict,
    Instance,
    Int,
    List,
    String,
)
from tests.support.util.api import verify_all

from _util_property import _TestModel

# Module under test
import bokeh.core.property.struct as bcps # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "Struct",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Struct:
    def test_init(self) -> None:
        with pytest.raises(ValueError):
            bcps.Struct()

    def test_valid(self) -> None:
        prop0 = bcps.Struct(a=Int, b=List(Int), c=Dict(Instance(_TestModel), String))

        assert prop0.is_valid(dict(a=0, b=[1], c={_TestModel(): "x"}))
        assert prop0.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): "x"}))
        assert prop0.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): "x"}))

        prop1 = bcps.Struct(a=Int, b=List(Int), c=bcps.Optional(Dict(Instance(_TestModel), String)))

        assert prop1.is_valid(dict(a=0, b=[1]))
        assert prop1.is_valid(bcps.struct(a=0, b=[1]))
        assert prop1.is_valid(SimpleNamespace(a=0, b=[1]))

        assert prop1.is_valid(dict(a=0, b=[1], c={_TestModel(): "x"}))
        assert prop1.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): "x"}))
        assert prop1.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): "x"}))

    def test_invalid(self) -> None:
        prop0 = bcps.Struct(a=Int, b=List(Int), c=Dict(Instance(_TestModel), String))

        assert not prop0.is_valid(0)
        assert not prop0.is_valid("")
        assert not prop0.is_valid(None)
        assert not prop0.is_valid([])

        assert not prop0.is_valid({})
        assert not prop0.is_valid(bcps.struct())
        assert not prop0.is_valid(SimpleNamespace())

        assert not prop0.is_valid({"a": 0})
        assert not prop0.is_valid(bcps.struct(a=0))
        assert not prop0.is_valid(SimpleNamespace(a=0))

        assert not prop0.is_valid({"a": 0, "b": [1]})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1]))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1]))

        assert not prop0.is_valid({"a": 0, "b": [1], "c": {_TestModel(): 0}})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): 0}))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): 0}))

        assert not prop0.is_valid({"a": 0, "b": [1], "d": {_TestModel(): "x"}})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], d={_TestModel(): "x"}))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], d={_TestModel(): "x"}))

        assert not prop0.is_valid({"a": 0, "b": [1], "c": {_TestModel(): "x"}, "d": "y"})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): "x"}, d="y"))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): "x"}, d="y"))

        prop1 = bcps.Struct(a=Int, b=List(Int), c=Dict(Instance(_TestModel), String))

        assert not prop1.is_valid(0)
        assert not prop1.is_valid("")
        assert not prop1.is_valid(None)
        assert not prop1.is_valid([])

        assert not prop1.is_valid({})
        assert not prop1.is_valid(bcps.struct())
        assert not prop1.is_valid(SimpleNamespace())

        assert not prop1.is_valid({"a": 0})
        assert not prop1.is_valid(bcps.struct(a=0))
        assert not prop1.is_valid(SimpleNamespace(a=0))

        assert not prop0.is_valid({"a": 0, "b": [1], "c": {_TestModel(): 0}})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): 0}))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): 0}))

        assert not prop0.is_valid({"a": 0, "b": [1], "d": {_TestModel(): "x"}})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], d={_TestModel(): "x"}))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], d={_TestModel(): "x"}))

        assert not prop0.is_valid({"a": 0, "b": [1], "c": {_TestModel(): "x"}, "d": "y"})
        assert not prop0.is_valid(bcps.struct(a=0, b=[1], c={_TestModel(): "x"}, d="y"))
        assert not prop0.is_valid(SimpleNamespace(a=0, b=[1], c={_TestModel(): "x"}, d="y"))

    def test_has_ref(self) -> None:
        prop0 = bcps.Struct(a=Int)
        assert not prop0.has_ref

        prop1 = bcps.Struct(a=Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcps.Struct(a=Int, b=List(Int), c=Dict(Instance(_TestModel), String))
        assert str(prop) == "Struct(a=Int, b=List(Int), c=Dict(Instance(_TestModel), String))"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_struct() -> None:
    obj = _TestModel()
    s = bcps.struct(a=1, b=[1, 2, 3], c={obj: "x"})

    assert s.a == 1
    assert s["a"] == 1

    assert s.b == [1, 2, 3]
    assert s["b"] == [1, 2, 3]

    assert s.c == {obj: "x"}
    assert s["c"] == {obj: "x"}

    s.a = 2
    assert s.a == 2
    assert s["a"] == 2

    s["a"] = 3
    assert s.a == 3
    assert s["a"] == 3

    s["d"] = {1, 2, 3}
    assert s.d == {1, 2, 3}
    assert s["d"] == {1, 2, 3}

    assert s.__dict__ == dict(a=3, b=[1, 2, 3], c={obj: "x"}, d={1, 2, 3})

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcps, ALL)
