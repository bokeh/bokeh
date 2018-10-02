#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
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
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.property.bases as bcpd

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Child(bcpd.PropertyDescriptorFactory):
    pass

def test_autocreate():
    obj = Child()
    value = obj.autocreate()
    assert isinstance(value, Child)

def test_make_descriptors_not_implemented():
    obj = bcpd.PropertyDescriptorFactory()
    with pytest.raises(NotImplementedError):
        obj.make_descriptors("foo")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bcpd, ALL)
