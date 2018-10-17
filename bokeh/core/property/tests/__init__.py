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
from bokeh.core.has_props import HasProps
from bokeh.model import Model

# Module under test
from bokeh.core.properties import Dict, Int, List, String

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _TestHasProps(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)

class _TestModel(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)

class _TestModel2(HasProps):
    x = Int(12)
    y = String("hello")
    z = List(Int, [1, 2, 3])
    zz = Dict(String, Int)
    s = String(None)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
