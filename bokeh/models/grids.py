""" A guide renderer for displaying grid lines on Bokeh plots.

"""
from __future__ import absolute_import

from ..properties import Int, String, Float, Auto, Instance, Tuple, Either, Include
from ..mixins import LineProps

from .renderers import GuideRenderer
from .tickers import Ticker

class Grid(GuideRenderer):
    """ Display horizontal or vertical grid lines at locations
    given by a supplied ``Ticker``.

    """
    dimension = Int(0, help="""
    Which dimension's Axis the Grid lines should intersect. The
    x-axis is dimension 0 (vertical Grid lines) and the y-axis
    is dimension 1 (horizontal Grid lines).
    """)

    bounds = Either(Auto, Tuple(Float, Float), help="""
    Constrain the Grid to only draw between specified bounds.
    """)

    x_range_name = String('default', help="""
    Configure this Grid to use a particular (named) Range of the
    associated Plot.
    """)

    y_range_name = String('default', help="""
    Configure this Grid to use a particular (named) Range of the
    associated Plot.
    """)

    ticker = Instance(Ticker, help="""
    A Ticker to use to determine locations for the Grid lines.
    """)

    grid_props = Include(LineProps, help="""
    Set the %s of the Grid lines.
    """)
