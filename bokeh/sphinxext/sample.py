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

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.model import Model
from bokeh.core.enums import enumeration
from bokeh.core.properties import Auto, Either, Enum, Float, Int, List, Tuple

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Bar',
    'baz',
    'Foo',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class Foo(Model):
    """ This is a Foo model. """
    index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
    value = Tuple(Float, Float, help="doc for value")

class Bar(Model):
    """ This is a Bar model. """
    thing = List(Int, help="doc for thing")

#: This is an enumeration
baz = enumeration("a", "b", "c")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
