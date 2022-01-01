#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

# External imports
import numpy as np

# Bokeh imports
from bokeh._testing.util.api import verify_all

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.primitive as bcpp # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Bool',
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

        assert prop.is_valid(np.bool8(False))
        assert prop.is_valid(np.bool8(True))

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

        assert not prop.is_valid(np.bool8(False))
        assert not prop.is_valid(np.bool8(True))

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

        assert not prop.is_valid(np.bool8(False))
        assert not prop.is_valid(np.bool8(True))
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

        assert not prop.is_valid(np.bool8(False))
        assert not prop.is_valid(np.bool8(True))
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
