#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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

# Bokeh imports
from . import _TestHasProps, _TestModel, _TestModel2
from bokeh.core.has_props import HasProps
from bokeh.core.properties import Float, Int
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.instance as bcpi

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Instance',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Test_Instance(object):

    def test_init(self):
        with pytest.raises(TypeError):
            bcpi.Instance()

    def test_valid(self):
        prop = bcpi.Instance(_TestModel)

        assert prop.is_valid(None)
        assert prop.is_valid(_TestModel())

    def test_invalid(self):
        prop = bcpi.Instance(_TestModel)
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

    def test_from_json(self):
        class MapOptions(HasProps):
            lat = Float
            lng = Float
            zoom = Int(12)

        v1 = bcpi.Instance(MapOptions).from_json(dict(lat=1, lng=2))
        v2 = MapOptions(lat=1, lng=2)
        assert v1.equals(v2)

    def test_has_ref(self):
        prop = bcpi.Instance(_TestModel)
        assert prop.has_ref

    def test_str(self):
        prop = bcpi.Instance(_TestModel)
        assert str(prop) == "Instance(_TestModel)"

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
