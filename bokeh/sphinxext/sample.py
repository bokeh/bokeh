#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' This modules simply provides some sample code for the documentation of
``bokeh.sphinxext`` itself.

'''

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
from bokeh.core.properties import Auto, Either, Enum, Float, Int, List, String, Tuple
from bokeh.util.options import Options

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Bar',
    'baz',
    'Foo',
    'Opts',
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

class Opts(Options):
    """ This is an Options class """

    host = String(default="localhost", help="a host to connect to")
    port = Int(default=5890, help="a port to connect to")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
