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

# Bokeh imports
from bokeh._testing.util.api import verify_all
from bokeh.core.has_props import HasProps

from _util_property import _TestHasProps, _TestModel, _TestModel2

# Module under test
import bokeh.core.property.instance as bcpi # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Instance',
    'InstanceDefault',
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
