#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for representing coordinate systems.

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

# Bokeh imports
from ..core.properties import Instance

from ..model import Model
from .ranges import Range, Range1d, DataRange1d
from .scales import Scale, LinearScale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Scope',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Scope(Model):

    x_range = Instance(Range, default=lambda: DataRange1d(), help="""
    The source range of the x-dimension of the plot.
    """)

    y_range = Instance(Range, default=lambda: DataRange1d(), help="""
    The source range of the y-dimension of the plot.
    """)

    x_scale = Instance(Scale, default=lambda: LinearScale(), help="""
    Defines how to map x-coordinates from data to screen space.
    """)

    y_scale = Instance(Scale, default=lambda: LinearScale(), help="""
    Defines how to map y-coordinates from data to screen space.
    """)

    x_target = Instance(Range1d, default=None, help="""
    The target range in the x-dimension onto which the sources range will be mapped.
    """)

    y_target = Instance(Range1d, default=None, help="""
    The target range in the y-dimension onto which the sources range will be mapped.
    """)

    outer = Instance("bokeh.models.canvas.Scope", default=None, help="""
    The outer (or parent) scope into this scope maps. If unset, the frame of a plot is used.
    """)

    def scope(self, **kwargs):
        return Scope(outer=self, **kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------
