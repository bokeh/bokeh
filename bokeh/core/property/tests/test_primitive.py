#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
import numpy as np

# Bokeh imports
from . import _TestHasProps, _TestModel
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.primitive as bcpp

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Bool',
    'Complex',
    'Int',
    'Float',
    'String',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Bool(object):

    def test_valid(self):
        prop = bcpp.Bool()

        assert prop.is_valid(None)

        assert prop.is_valid(False)
        assert prop.is_valid(True)

        assert prop.is_valid(np.bool8(False))
        assert prop.is_valid(np.bool8(True))

    def test_invalid(self):
        prop = bcpp.Bool()

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

    def test_has_ref(self):
        prop = bcpp.Bool()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpp.Bool()
        assert str(prop) == "Bool"

class Test_Complex(object):

    def test_valid(self):
        prop = bcpp.Complex()

        assert prop.is_valid(None)

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

    def test_invalid(self):
        prop = bcpp.Complex()

        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid(np.bool8(False))
        assert not prop.is_valid(np.bool8(True))

    def test_has_ref(self):
        prop = bcpp.Complex()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpp.Complex()
        assert str(prop) == "Complex"

class Test_Float(object):

    def test_valid(self):
        prop = bcpp.Float()

        assert prop.is_valid(None)

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

    def test_invalid(self):
        prop = bcpp.Float()

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

    def test_has_ref(self):
        prop = bcpp.Float()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpp.Float()
        assert str(prop) == "Float"

class Test_Int(object):

    def test_valid(self):
        prop = bcpp.Int()

        assert prop.is_valid(None)

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

    def test_invalid(self):
        prop = bcpp.Int()

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

    def test_has_ref(self):
        prop = bcpp.Int()
        assert not prop.has_ref

    def test_str(self):
        prop = bcpp.Int()
        assert str(prop) == "Int"

class Test_String(object):

    def test_valid(self):
        prop = bcpp.String()

        assert prop.is_valid(None)

        assert prop.is_valid("")
        assert prop.is_valid("6")

    def test_invalid(self):
        prop = bcpp.String()

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

    def test_has_ref(self):
        prop = bcpp.String()
        assert not prop.has_ref

    def test_str(self):
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
