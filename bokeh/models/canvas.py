#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.properties import Instance
from ..model import Model
from .ranges import DataRange1d, Range
from .scales import LinearScale, Scale

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CoordinateMapping",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class CoordinateMapping(Model):
    """ A mapping between two coordinate systems. """

    x_source = Instance(Range, default=lambda: DataRange1d())
    y_source = Instance(Range, default=lambda: DataRange1d())
    x_scale = Instance(Scale, default=lambda: LinearScale())
    y_scale = Instance(Scale, default=lambda: LinearScale())
    x_target = Instance(Range)
    y_target = Instance(Range)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
