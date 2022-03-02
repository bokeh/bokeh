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
from bokeh.core.properties import (
    Any,
    Float,
    Instance,
    Int,
    Seq,
    String,
)
from bokeh.core.property.wrappers import PropertyValueDict, PropertyValueList
from bokeh.models import ColumnDataSource

from _util_property import _TestHasProps, _TestModel

# Module under test
import bokeh.core.property.container as bcpc # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Array',
    'ColumnData',
    'Dict',
    'List',
    'RelativeDelta',
    'RestrictedDict',
    'Seq',
    'Tuple',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

# TODO (bev) class Test_RelativeDelta

class Test_ColumnData:

    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpc.ColumnData()

        assert issubclass(bcpc.ColumnData, bcpc.Dict)

    def test_has_ref(self) -> None:
        prop = bcpc.ColumnData(String, Seq(Any))
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.ColumnData(String, Seq(Any))
        assert str(prop) == "ColumnData(String, Seq(Any))"

    def test__hinted_value_with_hint_ColumnDataChanged(self) -> None:
        from bokeh.document.events import ColumnDataChangedEvent

        prop = bcpc.ColumnData(String, Seq(Any))
        source = ColumnDataSource(data=dict(foo=[10], bar=[20], baz=[30]))
        hint = ColumnDataChangedEvent("doc", source, "data", cols=["foo"])
        assert prop._hinted_value(source.data, hint) == dict(foo=[10])

    def test__hinted_value_with_hint_ColumnsStreamed(self) -> None:
        from bokeh.document.events import ColumnsStreamedEvent

        prop = bcpc.ColumnData(String, Seq(Any))
        source = ColumnDataSource(data=dict(foo=[10], bar=[20], baz=[30]))
        new_data = dict(foo=[11], bar=[21], baz=[31])
        hint = ColumnsStreamedEvent("doc", source, "data", new_data, rollover=10)
        assert prop._hinted_value(source.data, hint) == new_data

    def test__hinted_value_without_hint(self) -> None:
        prop = bcpc.ColumnData(String, Seq(Any))
        source = ColumnDataSource(data=dict(foo=[10], bar=[20], baz=[30]))
        assert prop._hinted_value(source.data, None) == source.data


class Test_Array:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpc.Array()

    def test_valid(self) -> None:
        prop = bcpc.Array(Float)

        assert prop.is_valid(np.array([1,2,3]))

    def test_invalid(self) -> None:
        prop = bcpc.Array(Float)

        assert not prop.is_valid(None)
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

    def test_has_ref(self) -> None:
        prop = bcpc.Array(Float)
        assert not prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.Array(Float)
        assert str(prop) == "Array(Float)"


class Test_Dict:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpc.Dict()

    def test_valid(self) -> None:
        prop = bcpc.Dict(String, bcpc.List(Int))

        assert prop.is_valid({})
        assert prop.is_valid({"foo": [1,2,3]})

    def test_invalid(self) -> None:
        prop = bcpc.Dict(String, bcpc.List(Int))

        assert not prop.is_valid(None)
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

    def test_has_ref(self) -> None:
        prop = bcpc.Dict(String, Int)
        assert not prop.has_ref

        prop = bcpc.Dict(String, Instance(_TestModel))
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.Dict(String, Int)
        assert str(prop) == "Dict(String, Int)"

    def test_wrap(self) -> None:
        prop = bcpc.Dict(String, Int)
        wrapped = prop.wrap({"foo": 10})
        assert isinstance(wrapped, PropertyValueDict)
        assert prop.wrap(wrapped) is wrapped

class Test_List:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpc.List()

    def test_valid(self) -> None:
        prop = bcpc.List(Int)

        assert prop.is_valid([])
        assert prop.is_valid([1,2,3])

    def test_invalid(self) -> None:
        prop = bcpc.List(Int)

        assert not prop.is_valid(None)
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

    def test_has_ref(self) -> None:
        prop = bcpc.List(Int)
        assert not prop.has_ref

        prop = bcpc.List(Instance(_TestModel))
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.List(Int)
        assert str(prop) == "List(Int)"

    def test_wrap(self) -> None:
        prop = bcpc.List(Int)
        wrapped = prop.wrap([10, 20])
        assert isinstance(wrapped, PropertyValueList)
        assert prop.wrap(wrapped) is wrapped

class Test_Seq:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpc.Seq()

    def test_valid(self) -> None:
        prop = bcpc.Seq(Int)

        assert prop.is_valid(())
        assert prop.is_valid([])
        assert prop.is_valid(np.array([1,2,3]))

        assert prop.is_valid((1, 2))
        assert prop.is_valid([1, 2])
        assert prop.is_valid(np.array([1, 2]))

    def test_invalid(self) -> None:
        prop = bcpc.Seq(Int)

        assert not prop.is_valid(None)
        assert not prop.is_valid(False)
        assert not prop.is_valid(True)
        assert not prop.is_valid(0)
        assert not prop.is_valid(1)
        assert not prop.is_valid(0.0)
        assert not prop.is_valid(1.0)
        assert not prop.is_valid(1.0+1.0j)
        assert not prop.is_valid("")

        assert not prop.is_valid(set())
        assert not prop.is_valid({})

        assert not prop.is_valid({1, 2})
        assert not prop.is_valid({1: 2})

        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(_TestModel())

    def test_with_pandas_valid(self, pd) -> None:
        prop = bcpc.Seq(Int)

        df = pd.DataFrame([1, 2])
        assert prop.is_valid(df.index)
        assert prop.is_valid(df.iloc[0])

    def test_has_ref(self) -> None:
        prop = bcpc.Seq(Int)
        assert not prop.has_ref

        prop = bcpc.Seq(Instance(_TestModel))
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.Seq(Int)
        assert str(prop) == "Seq(Int)"


class Test_Tuple:
    def test_Tuple(self) -> None:
        with pytest.raises(TypeError):
            bcpc.Tuple()

        with pytest.raises(TypeError):
            bcpc.Tuple(Int)

    def test_valid(self) -> None:
        prop = bcpc.Tuple(Int, String, bcpc.List(Int))

        assert prop.is_valid((1, "", [1, 2, 3]))

    def test_invalid(self) -> None:
        prop = bcpc.Tuple(Int, String, bcpc.List(Int))

        assert not prop.is_valid(None)
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

    def test_has_ref(self) -> None:
        prop = bcpc.Tuple(Int, Int)
        assert not prop.has_ref

        prop = bcpc.Tuple(Int, Instance(_TestModel))
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpc.Tuple(Int, Int)
        assert str(prop) == "Tuple(Int, Int)"

class Test_RestrictedDict:
    def test_valid(self) -> None:
        prop = bcpc.RestrictedDict(String, bcpc.List(Int), disallow=("disallowed_key_1", "disallowed_key_2"))

        assert prop.is_valid({"non_disallowed_key_1": [1,2,3]})
        assert prop.is_valid({"non_disallowed_key_2": [1,2,3]})

    def test_invalid(self) -> None:
        prop = bcpc.RestrictedDict(String, bcpc.List(Int), disallow=("disallowed_key_1", "disallowed_key_2"))

        assert not prop.is_valid({"disallowed_key_1": [1,2,3]})
        assert not prop.is_valid({"disallowed_key_2": [1,2,3]})

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
