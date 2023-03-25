#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
import warnings
from typing import TYPE_CHECKING, Union

# Bokeh imports
from bokeh.core.properties import (
    Dict,
    Instance,
    Int,
    List,
    String,
)
from bokeh.core.property.wrappers import PropertyValueDict, PropertyValueList
from bokeh.util.warnings import BokehDeprecationWarning
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

if TYPE_CHECKING:
    from bokeh.core.has_props import HasProps

# Module under test
import bokeh.core.property.nullable as bcpn # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    "NonNullable",
    "Nullable",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Nullable:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpn.Nullable()
        with pytest.raises(ValueError):
            bcpn.Nullable(Int(help="inner help"))

        prop0 = bcpn.Nullable(Int(), help="help")
        assert prop0._help == prop0.__doc__ == "help"

    def test_eq(self) -> None:
        assert (bcpn.Nullable(Int) == Union[int, None]) is False

        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int)) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int)) is True
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int())) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int())) is True

        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int())) is True
        assert (bcpn.Nullable(Int()) == bcpn.Nullable(Int(0))) is True
        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int(0))) is True

        assert (bcpn.Nullable(Int(1)) == bcpn.Nullable(Int(0))) is False
        assert (bcpn.Nullable(Int(0)) == bcpn.Nullable(Int(1))) is False
        assert (bcpn.Nullable(Int(1)) == bcpn.Nullable(Int(1))) is True

        assert (bcpn.Nullable(Int, help="helpful") == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int, help="helpful")) is False
        assert (bcpn.Nullable(Int, help="helpful") == bcpn.Nullable(Int, help="helpful")) is True

        assert (bcpn.Nullable(Int, default=10) == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int, default=10)) is False
        assert (bcpn.Nullable(Int, default=10) == bcpn.Nullable(Int, default=10)) is True

        def f(s: str) -> int:
            return int(s)

        assert (bcpn.Nullable(Int).accepts(String, f) == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int).accepts(String, f)) is False
        assert (bcpn.Nullable(Int).accepts(String, f) == bcpn.Nullable(Int).accepts(String, f)) is True

        def g(_o: HasProps, v: int | None) -> bool:
            return v is not None and v >= 0

        assert (bcpn.Nullable(Int).asserts(g, ">= 0") == bcpn.Nullable(Int)) is False
        assert (bcpn.Nullable(Int) == bcpn.Nullable(Int).asserts(g, ">= 0")) is False
        assert (bcpn.Nullable(Int).asserts(g, ">= 0") == bcpn.Nullable(Int).asserts(g, ">= 0")) is True

    def test_clone(self) -> None:
        p0 = bcpn.Nullable(Int)
        c0 = p0()

        assert c0.default is None
        assert c0.help is None
        assert c0.alternatives == []
        assert c0.assertions == []

        assert p0 is not c0
        assert p0 == c0
        assert c0.type_params == p0.type_params

        p1 = bcpn.Nullable(Int, default=10, help="helpful")
        c1 = p1()

        assert c1.default == 10
        assert c1.help == "helpful"
        assert c1.alternatives == []
        assert c1.assertions == []

        assert p1 is not c1
        assert p1 == c1
        assert c1.type_params == p1.type_params

        p2 = bcpn.Nullable(Int)
        c2 = p2(default=20, help="helpful")

        assert c2.default == 20
        assert c2.help == "helpful"
        assert c2.alternatives == []
        assert c2.assertions == []

        assert p2 is not c2
        assert p2 != c2
        assert c2.type_params == p2.type_params

        p3 = bcpn.Nullable(Int, default=10, help="helpful")
        c3 = p3(default=20, help="unhelpful")

        assert c3.default == 20
        assert c3.help == "unhelpful"
        assert c3.alternatives == []
        assert c3.assertions == []

        assert p3 is not c3
        assert p3 != c3
        assert c3.type_params == p3.type_params

    def test_valid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert prop.is_valid(None)

        assert prop.is_valid([])
        assert prop.is_valid([1, 2, 3])

    def test_invalid(self) -> None:
        prop = bcpn.Nullable(List(Int))

        assert not prop.is_valid(-100)
        assert not prop.is_valid("yyy")
        assert not prop.is_valid([1, 2, ""])

        assert not prop.is_valid(())
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop0 = bcpn.Nullable(Int)
        assert not prop0.has_ref
        prop1 = bcpn.Nullable(Instance(_TestModel))
        assert prop1.has_ref

    def test_str(self) -> None:
        prop = bcpn.Nullable(List(Int))
        assert str(prop) == "Nullable(List(Int))"

    def test_wrap_dict(self) -> None:
        prop = bcpn.Nullable(Dict(String, Int))
        assert prop.wrap(None) is None
        wrapped = prop.wrap({"foo": 10})
        assert isinstance(wrapped, PropertyValueDict)
        assert prop.wrap(wrapped) is wrapped

    def test_wrap_list(self) -> None:
        prop = bcpn.Nullable(List(Int))
        assert prop.wrap(None) is None
        wrapped = prop.wrap([10, 20])
        assert isinstance(wrapped, PropertyValueList)
        assert prop.wrap(wrapped) is wrapped

class Test_NonNullable:

    def _test_deprecation(self) -> None:
        with pytest.warns(BokehDeprecationWarning):
            bcpn.NonNullable(List(Int))

    def test_str(self) -> None:
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=BokehDeprecationWarning)
            prop = bcpn.NonNullable(List(Int))
            assert str(prop) == "NonNullable(List(Int))"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpn, ALL)
