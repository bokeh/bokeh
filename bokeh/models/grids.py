''' A guide renderer for displaying grid lines on Bokeh plots.

'''
from __future__ import absolute_import

from ..core.properties import Auto, Either, Float, Include, Instance, Int, Override, String, Tuple
from ..core.property_mixins import FillProps, LineProps

from .renderers import GuideRenderer
from .tickers import Ticker

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
    Bounds for the rendered grid lines. If unset, the grid
    lines will span the entire plot in the given dimension.
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
    """)

    grid_props = Include(LineProps, help="""
    The %s of the Grid lines.
    """)

    grid_line_color = Override(default='#e5e5e5')

    minor_grid_props = Include(LineProps, help="""
    The %s of the minor Grid lines.
    """)

    minor_grid_line_color = Override(default=None)

    band_props = Include(FillProps, help="""
    The %s of alternating bands between Grid lines.
    """)

    band_fill_alpha = Override(default=0)

    band_fill_color = Override(default=None)

    level = Override(default="underlay")
