#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for all Bokeh widget models.

In addition to different kinds of plots, various kinds of UI controls (e.g.
sliders, buttons, inputs, etc.) can be included in Bokeh documents. These
widgets can be used in conjunction with ``CustomJS`` callbacks that execute
in the browser,  or with python callbacks that execute on a Bokeh server.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import Enum, Int, Override
from ..layouts import LayoutDOM

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Widget',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Widget(LayoutDOM):
    ''' A base class for all interactive widget types.

    '''

    orientation = Enum("horizontal", "vertical", help="""
    Orient the widget either horizontally (default) or vertically.

    Note that not all widgets support vertical orientation.
    """)

    default_size = Int(default=300, help="""
    The default size (width or height) in the dominating dimension.

    The dominating dimension is determined by widget orientation.
    """)

    margin = Override(default=(5, 5, 5, 5))

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
