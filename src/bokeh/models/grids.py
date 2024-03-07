#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A guide renderer for displaying grid lines on Bokeh plots.

'''

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
from ..core.properties import (
    Auto,
    Either,
    Float,
    Include,
    Instance,
    Int,
    Nullable,
    Override,
    Seq,
    Tuple,
)
from ..core.property_mixins import ScalarFillProps, ScalarHatchProps, ScalarLineProps
from .axes import Axis
from .renderers import GuideRenderer
from .tickers import FixedTicker, Ticker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Grid',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Grid(GuideRenderer):
    ''' Display horizontal or vertical grid lines at locations
    given by a supplied ``Ticker``.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    dimension = Int(0, help="""
    Which dimension the Axis Grid lines will intersect. The
    x-axis is dimension 0 (vertical Grid lines) and the y-axis
    is dimension 1 (horizontal Grid lines).
    """)

    bounds = Either(Auto, Tuple(Float, Float), help="""
    Bounds for the rendered grid lines. By default, a grid will look for a
    corresponding axis to ask for bounds. If one cannot be found, the grid
    will span the entire visible range.
    """)

    cross_bounds = Either(Auto, Tuple(Float, Float), help="""
    Bounds for the rendered grid lines in the orthogonal direction. By default,
    a grid will span the entire visible range.
    """)

    axis = Nullable(Instance(Axis), help="""
    An Axis to delegate ticking to. If the ticker property is None, then the
    Grid will use the ticker on the specified axis for computing where to draw
    grid lines. Otherwise, it ticker is not None, it will take precedence over
    any Axis.
    """)

    ticker = Nullable(Instance(Ticker), help="""
    A Ticker to use for computing locations for the Grid lines.
    """).accepts(Seq(Float), lambda ticks: FixedTicker(ticks=ticks))

    grid_props = Include(ScalarLineProps, prefix="grid", help="""
    The {prop} of the Grid lines.
    """)

    grid_line_color = Override(default='#e5e5e5')

    minor_grid_props = Include(ScalarLineProps, prefix="minor_grid", help="""
    The {prop} of the minor Grid lines.
    """)

    minor_grid_line_color = Override(default=None)

    band_fill_props = Include(ScalarFillProps, prefix="band", help="""
    The {prop} of alternating bands between Grid lines.
    """)

    band_fill_alpha = Override(default=0)

    band_fill_color = Override(default=None)

    band_hatch_props = Include(ScalarHatchProps, prefix="band", help="""
    The {prop} of alternating bands between Grid lines.
    """)

    level = Override(default="underlay")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
