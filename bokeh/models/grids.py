#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' A guide renderer for displaying grid lines on Bokeh plots.

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
from ..core.properties import Auto, Either, Float, Include, Instance, Int, Override, Seq, String, Tuple
from ..core.property_mixins import ScalarFillProps, ScalarHatchProps, ScalarLineProps

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

    # Note: we must allow the possibility of setting both
    # range names be cause if a grid line is "traced" along
    # a path, ranges in both dimensions will matter.

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering a grid on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering a grid on the plot. If unset, use the
    default y-range.
    """)

    ticker = Instance(Ticker, help="""
    The Ticker to use for computing locations for the Grid lines.
    """).accepts(Seq(Float), lambda ticks: FixedTicker(ticks=ticks))

    grid_props = Include(ScalarLineProps, help="""
    The %s of the Grid lines.
    """)

    grid_line_color = Override(default='#e5e5e5')

    minor_grid_props = Include(ScalarLineProps, help="""
    The %s of the minor Grid lines.
    """)

    minor_grid_line_color = Override(default=None)

    band_fill_props = Include(ScalarFillProps, use_prefix="band", help="""
    The %s of alternating bands between Grid lines.
    """)

    band_fill_alpha = Override(default=0)

    band_fill_color = Override(default=None)

    band_hatch_props = Include(ScalarHatchProps, use_prefix="band", help="""
    The %s of alternating bands between Grid lines.
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
