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
from typing import TYPE_CHECKING

# External imports
import numpy as np

# Bokeh imports
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

if TYPE_CHECKING:
    from bokeh.core.has_props import HasProps

# Module under test
import bokeh.core.property.primitive as bcpp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Bool',
    'Bytes',
    'Complex',
    'Int',
    'Float',
    'Null',
    'String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Bool:

    def test_valid(self) -> None:
        prop = bcpp.Bool()

        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(np.bool_(False))
        assert prop.is_valid(np.bool_(True))

    def test_invalid(self) -> None:
        prop = bcpp.Bool()

        assert not prop.is_valid(None)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(np.int8(0))
        assert not prop.is_valid(np.int8(1))
        assert not prop.is_valid(np.int16(0))
        assert not prop.is_valid(np.int16(1))
        assert not prop.is_valid(np.int32(0))
        assert not prop.is_valid(np.int32(1))
        assert not prop.is_valid(np.int64(0))
        assert not prop.is_valid(np.int64(1))
        assert not prop.is_valid(np.uint8(0))
        assert not prop.is_valid(np.uint8(1))
        assert not prop.is_valid(np.uint16(0))
        assert not prop.is_valid(np.uint16(1))
        assert not prop.is_valid(np.uint32(0))
        assert not prop.is_valid(np.uint32(1))
        assert not prop.is_valid(np.uint64(0))
        assert not prop.is_valid(np.uint64(1))
        assert not prop.is_valid(np.float16(0))
        assert not prop.is_valid(np.float16(1))
        assert not prop.is_valid(np.float32(0))
        assert not prop.is_valid(np.float32(1))
        assert not prop.is_valid(np.float64(0))
        assert not prop.is_valid(np.float64(1))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_has_ref(self) -> None:
        prop = bcpp.Bool()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.Bool()
        assert str(prop) == "Bool"


class Test_Complex:
    def test_valid(self) -> None:
        prop = bcpp.Complex()

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)
        assert prop.is_valid(1.0+1.0j)

        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))
        assert prop.is_valid(np.float16(0))
        assert prop.is_valid(np.float16(1))
        assert prop.is_valid(np.float32(0))
        assert prop.is_valid(np.float32(1))
        assert prop.is_valid(np.float64(0))
        assert prop.is_valid(np.float64(1))
        assert prop.is_valid(np.complex64(1.0+1.0j))
        assert prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert prop.is_valid(np.complex256(1.0+1.0j))

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self) -> None:
        prop = bcpp.Complex()

        assert not prop.is_valid(None)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(np.bool_(False))
        assert not prop.is_valid(np.bool_(True))

    def test_has_ref(self) -> None:
        prop = bcpp.Complex()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.Complex()
        assert str(prop) == "Complex"


class Test_Float:
    def test_valid(self) -> None:
        prop = bcpp.Float()

        assert prop.is_valid(0)
        assert prop.is_valid(1)
        assert prop.is_valid(0.0)
        assert prop.is_valid(1.0)

        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))
        assert prop.is_valid(np.float16(0))
        assert prop.is_valid(np.float16(1))
        assert prop.is_valid(np.float32(0))
        assert prop.is_valid(np.float32(1))
        assert prop.is_valid(np.float64(0))
        assert prop.is_valid(np.float64(1))

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self) -> None:
        prop = bcpp.Float()

        assert not prop.is_valid(None)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(np.bool_(False))
        assert not prop.is_valid(np.bool_(True))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_has_ref(self) -> None:
        prop = bcpp.Float()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.Float()
        assert str(prop) == "Float"


class Test_Int:

    def test_eq(self) -> None:
        assert (bcpp.Int() == int) is False

        assert (bcpp.Int() == bcpp.Int()) is True
        assert (bcpp.Int(default=0) == bcpp.Int()) is True

        assert (bcpp.Int(default=1) == bcpp.Int()) is False
        assert (bcpp.Int() == bcpp.Int(default=1)) is False
        assert (bcpp.Int(default=1) == bcpp.Int(default=1)) is True

        assert (bcpp.Int(help="heplful") == bcpp.Int()) is False
        assert (bcpp.Int() == bcpp.Int(help="heplful")) is False
        assert (bcpp.Int(help="heplful") == bcpp.Int(help="heplful")) is True

        def f(s: str) -> int:
            return int(s)

        assert (bcpp.Int().accepts(bcpp.String, f) == bcpp.Int()) is False
        assert (bcpp.Int() == bcpp.Int().accepts(bcpp.String, f)) is False
        assert (bcpp.Int().accepts(bcpp.String, f) == bcpp.Int().accepts(bcpp.String, f)) is True

        def g(_o: HasProps, v: int) -> bool:
            return v >= 0

        assert (bcpp.Int().asserts(g, ">= 0") == bcpp.Int()) is False
        assert (bcpp.Int() == bcpp.Int().asserts(g, ">= 0")) is False
        assert (bcpp.Int().asserts(g, ">= 0") == bcpp.Int().asserts(g, ">= 0")) is True

    def test_clone(self) -> None:
        p0 = bcpp.Int()
        c0 = p0()

        assert c0.default == 0
        assert c0.help is None
        assert c0.alternatives == []
        assert c0.assertions == []

        assert p0 is not c0
        assert p0 == c0

        p1 = bcpp.Int(default=10, help="helpful")
        c1 = p1()

        assert c1.default == 10
        assert c1.help == "helpful"
        assert c1.alternatives == []
        assert c1.assertions == []

        assert p1 is not c1
        assert p1 == c1

        p2 = bcpp.Int()
        c2 = p2(default=20, help="helpful")

        assert c2.default == 20
        assert c2.help == "helpful"
        assert c2.alternatives == []
        assert c2.assertions == []

        assert p2 is not c2
        assert p2 != c2

        p3 = bcpp.Int(default=10, help="helpful")
        c3 = p3(default=20, help="unhelpful")

        assert c3.default == 20
        assert c3.help == "unhelpful"
        assert c3.alternatives == []
        assert c3.assertions == []

        assert p3 is not c3
        assert p3 != c3

    def test_valid(self) -> None:
        prop = bcpp.Int()

        assert prop.is_valid(0)
        assert prop.is_valid(1)

        assert prop.is_valid(np.int8(0))
        assert prop.is_valid(np.int8(1))
        assert prop.is_valid(np.int16(0))
        assert prop.is_valid(np.int16(1))
        assert prop.is_valid(np.int32(0))
        assert prop.is_valid(np.int32(1))
        assert prop.is_valid(np.int64(0))
        assert prop.is_valid(np.int64(1))
        assert prop.is_valid(np.uint8(0))
        assert prop.is_valid(np.uint8(1))
        assert prop.is_valid(np.uint16(0))
        assert prop.is_valid(np.uint16(1))
        assert prop.is_valid(np.uint32(0))
        assert prop.is_valid(np.uint32(1))
        assert prop.is_valid(np.uint64(0))
        assert prop.is_valid(np.uint64(1))

        # TODO (bev) should fail
        assert prop.is_valid(False)
        assert prop.is_valid(True)

    def test_invalid(self) -> None:
        prop = bcpp.Int()

        assert not prop.is_valid(None)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(np.bool_(False))
        assert not prop.is_valid(np.bool_(True))
        assert not prop.is_valid(np.float16(0))
        assert not prop.is_valid(np.float16(1))
        assert not prop.is_valid(np.float32(0))
        assert not prop.is_valid(np.float32(1))
        assert not prop.is_valid(np.float64(0))
        assert not prop.is_valid(np.float64(1))
        assert not prop.is_valid(np.complex64(1.0+1.0j))
        assert not prop.is_valid(np.complex128(1.0+1.0j))
        if hasattr(np, "complex256"):
            assert not prop.is_valid(np.complex256(1.0+1.0j))

    def test_has_ref(self) -> None:
        prop = bcpp.Int()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.Int()
        assert str(prop) == "Int"

class Test_Bytes:
    def test_valid(self) -> None:
        prop = bcpp.Bytes()

        assert prop.is_valid(b"")
        assert prop.is_valid(b"some")

    def test_invalid(self) -> None:
        prop = bcpp.Bytes()

        assert not prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")
        assert not prop.is_valid("some")

        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop = bcpp.Bytes()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.Bytes()
        assert str(prop) == "Bytes"

class Test_String:
    def test_valid(self) -> None:
        prop = bcpp.String()

        assert prop.is_valid("")
        assert prop.is_valid("6")

    def test_invalid(self) -> None:
        prop = bcpp.String()

        assert not prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid(b"")
        assert not prop.is_valid(b"some")

        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self) -> None:
        prop = bcpp.String()
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpp.String()
        assert str(prop) == "String"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpp, ALL)
