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
from bokeh.core.properties import Instance, Int, Float, String
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.container as bcpc

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Array',
    'ColumnData',
    'Dict',
    'List',
    'RelativeDelta',
    'Seq',
    'Tuple',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO (bev) class Test_ColumnData
# TODO (bev) class Test_RelativeDelta

class Test_Array(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpc.Array()

    def test_valid(self):
        prop = bcpc.Array(Float)

        assert prop.is_valid(None)
        assert prop.is_valid(np.array([1,2,3]))

    def test_invalid(self):
        prop = bcpc.Array(Float)

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
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

    def test_has_ref(self):
        prop = bcpc.Array(Float)
        assert not prop.has_ref

    def test_str(self):
        prop = bcpc.Array(Float)
        assert str(prop) == "Array(Float)"

class Test_Dict(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpc.Dict()

    def test_valid(self):
        prop = bcpc.Dict(String, bcpc.List(Int))

        assert prop.is_valid(None)
        assert prop.is_valid({})
        assert prop.is_valid({"foo": [1,2,3]})

    def test_invalid(self):
        prop = bcpc.Dict(String, bcpc.List(Int))

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)

        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({"foo": [1,2,3.5]})

        assert not prop.is_valid(np.array([1,2,3]))

        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self):
        prop = bcpc.Dict(String, Int)
        assert not prop.has_ref

        prop = bcpc.Dict(String, Instance(_TestModel))
        assert prop.has_ref

    def test_str(self):
        prop = bcpc.Dict(String, Int)
        assert str(prop) == "Dict(String, Int)"

class Test_List(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpc.List()

    def test_valid(self):
        prop = bcpc.List(Int)

        assert prop.is_valid(None)
        assert prop.is_valid([])
        assert prop.is_valid([1,2,3])

    def test_invalid(self):
        prop = bcpc.List(Int)

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)

        assert not prop.is_valid([1,2,3.5])
        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid({})

        assert not prop.is_valid(np.array([1,2,3]))

        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_has_ref(self):
        prop = bcpc.List(Int)
        assert not prop.has_ref

        prop = bcpc.List(Instance(_TestModel))
        assert prop.has_ref

    def test_str(self):
        prop = bcpc.List(Int)
        assert str(prop) == "List(Int)"

class Test_Seq(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpc.Seq()

    def test_valid(self):
        prop = bcpc.Seq(Int)

        assert prop.is_valid(None)

        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid(np.array([1,2,3]))

        assert prop.is_valid((1, 2))
        assert prop.is_valid([1, 2])
        assert prop.is_valid(np.array([1, 2]))

    def test_invalid(self):
        prop = bcpc.Seq(Int)

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")

        assert not prop.is_valid(set([]))
        assert not prop.is_valid({})

        assert not prop.is_valid({1, 2})
        assert not prop.is_valid({1: 2})

        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_with_pandas_valid(self, pd):
        prop = bcpc.Seq(Int)

        df = pd.DataFrame([1, 2])
        assert prop.is_valid(df.index)
        assert prop.is_valid(df.iloc[0])

    def test_has_ref(self):
        prop = bcpc.Seq(Int)
        assert not prop.has_ref

        prop = bcpc.Seq(Instance(_TestModel))
        assert prop.has_ref

    def test_str(self):
        prop = bcpc.Seq(Int)
        assert str(prop) == "Seq(Int)"

class Test_Tuple(object):

    def test_Tuple(self):
        with pytest.raises(TypeError):
            bcpc.Tuple()

        with pytest.raises(TypeError):
            bcpc.Tuple(Int)

    def test_valid(self):
        prop = bcpc.Tuple(Int, String, bcpc.List(Int))

        assert prop.is_valid(None)

        assert prop.is_valid((1, "", [1, 2, 3]))

    def test_invalid(self):
        prop = bcpc.Tuple(Int, String, bcpc.List(Int))

        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)

        assert not prop.is_valid("")
        assert not prop.is_valid(())
        assert not prop.is_valid([])
        assert not prop.is_valid({})

        assert not prop.is_valid(np.array([1,2,3]))

        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

        assert not prop.is_valid((1.0, "", [1, 2, 3]))
        assert not prop.is_valid((1, True, [1, 2, 3]))
        assert not prop.is_valid((1, "", (1, 2, 3)))
        assert not prop.is_valid((1, "", [1, 2, "xyz"]))

    def test_has_ref(self):
        prop = bcpc.Tuple(Int, Int)
        assert not prop.has_ref

        prop = bcpc.Tuple(Int, Instance(_TestModel))
        assert prop.has_ref

    def test_str(self):
        prop = bcpc.Tuple(Int, Int)
        assert str(prop) == "Tuple(Int, Int)"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpc, ALL)
