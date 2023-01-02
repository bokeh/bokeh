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

# External imports
from pandas import DataFrame, Series
from pandas.core.groupby import GroupBy

# Bokeh imports
from bokeh.core.has_props import HasProps
from tests.support.util.api import verify_all

from _util_property import _TestHasProps, _TestModel, _TestModel2

# Module under test
import bokeh.core.property.instance as bcpi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Instance',
    'InstanceDefault',
    'Object',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_InstanceDefault:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpi.InstanceDefault()

        bcpi.InstanceDefault(_TestModel)
        bcpi.InstanceDefault(_TestModel, x=10)
        bcpi.InstanceDefault(_TestModel, x=10, z=[10])

    @pytest.mark.parametrize('kwargs', [{}, {'x': 10}, {'x': 10, 'z': [10]}])
    def test___call__(self, kwargs) -> None:
        default  =_TestModel()

        m = bcpi.InstanceDefault(_TestModel, **kwargs)()
        for prop in m.properties():
            assert getattr(m, prop) == kwargs.get(prop, getattr(default, prop))

    def test___repr__(self) -> None:
        m = bcpi.InstanceDefault(_TestModel, x=10, z=[10])
        assert repr(m) == "<Instance: _util_property._TestModel(x=10, z=[10])>"

class Test_Object:

    def test_valid(self) -> None:
        prop0 = bcpi.Object(Series)
        assert prop0.is_valid(Series([1, 2, 3]))
        prop1 = bcpi.Object("pandas.Series")
        assert prop1.is_valid(Series([1, 2, 3]))

        prop2 = bcpi.Object(DataFrame)
        assert prop2.is_valid(DataFrame())
        prop3 = bcpi.Object("pandas.DataFrame")
        assert prop3.is_valid(DataFrame())

        prop4 = bcpi.Object(GroupBy)
        assert prop4.is_valid(GroupBy(DataFrame()))
        prop5 = bcpi.Object("pandas.core.groupby.GroupBy")
        assert prop5.is_valid(GroupBy(DataFrame()))

    def test_invalid(self) -> None:
        prop0 = bcpi.Object(Series)
        assert not prop0.is_valid(DataFrame())
        assert not prop0.is_valid(GroupBy(DataFrame()))
        assert not prop0.is_valid({})
        assert not prop0.is_valid(object())
        assert not prop0.is_valid(_TestModel())
        prop1 = bcpi.Object("pandas.Series")
        assert not prop1.is_valid(DataFrame())
        assert not prop1.is_valid(GroupBy(DataFrame()))
        assert not prop1.is_valid({})
        assert not prop1.is_valid(object())
        assert not prop1.is_valid(_TestModel())

        prop2 = bcpi.Object(DataFrame)
        assert not prop2.is_valid(Series([1, 2, 3]))
        assert not prop2.is_valid(GroupBy(DataFrame()))
        assert not prop2.is_valid({})
        assert not prop2.is_valid(object())
        assert not prop2.is_valid(_TestModel())
        prop3 = bcpi.Object("pandas.DataFrame")
        assert not prop3.is_valid(Series([1, 2, 3]))
        assert not prop3.is_valid(GroupBy(DataFrame()))
        assert not prop3.is_valid({})
        assert not prop3.is_valid(object())
        assert not prop3.is_valid(_TestModel())

        prop4 = bcpi.Object(GroupBy)
        assert not prop4.is_valid(Series([1, 2, 3]))
        assert not prop4.is_valid(DataFrame())
        assert not prop4.is_valid({})
        assert not prop4.is_valid(object())
        assert not prop4.is_valid(_TestModel())
        prop5 = bcpi.Object("pandas.core.groupby.GroupBy")
        assert not prop5.is_valid(Series([1, 2, 3]))
        assert not prop5.is_valid(DataFrame())
        assert not prop5.is_valid({})
        assert not prop5.is_valid(object())
        assert not prop5.is_valid(_TestModel())

class Test_Instance:
    def test_init(self) -> None:
        with pytest.raises(TypeError):
            bcpi.Instance()

    def test_serialized(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.serialized is True

    def test_readonly(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.readonly is False

    def test_valid(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.is_valid(_TestModel())

    def test_invalid(self) -> None:
        prop = bcpi.Instance(_TestModel)
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
        assert not prop.is_valid(_TestModel2())
        assert not prop.is_valid(_TestHasProps())
        assert not prop.is_valid(object())

    def test_has_ref(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert prop.has_ref

    def test_str(self) -> None:
        prop = bcpi.Instance(_TestModel)
        assert str(prop) == "Instance(_TestModel)"

    def test_explicit_default(self) -> None:
        default =_TestModel(x=10)
        class ExplicitDefault(HasProps):
            m = bcpi.Instance(_TestModel, default=default)

        obj = ExplicitDefault()
        assert isinstance(obj.m, _TestModel)
        for prop in default.properties():
            assert getattr(obj.m, prop) == getattr(default, prop)

    def test_instance_default(self) -> None:
        default =_TestModel(x=10)
        class ExplicitDefault(HasProps):
            m = bcpi.Instance(_TestModel, default=bcpi.InstanceDefault(_TestModel, x=10))

        obj = ExplicitDefault()
        assert isinstance(obj.m, _TestModel)
        for prop in default.properties():
            assert getattr(obj.m, prop) == getattr(default, prop)

    def test_lambda_default(self) -> None:
        default =_TestModel(x=10)
        class ExplicitDefault(HasProps):
            m = bcpi.Instance(_TestModel, default=lambda: _TestModel(x=10))

        obj = ExplicitDefault()
        assert isinstance(obj.m, _TestModel)
        for prop in default.properties():
            assert getattr(obj.m, prop) == getattr(default, prop)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpi, ALL)
