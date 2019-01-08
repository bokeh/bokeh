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
from six import string_types

# Bokeh imports
from ..core.enums import HorizontalLocation, VerticalLocation
from ..core.properties import Auto, Either, Enum, Int, Seq, Instance, String
from ..models import GMapPlot, LinearAxis, MercatorTicker, MercatorTickFormatter, Range1d, Title, Tool
from ..models import glyphs, markers
from ..models.tools import Drag, Inspection, Scroll, Tap
from ..util.options import Options
from .helpers import _process_tools_arg, _process_active_tools, _glyph_function

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_TOOLS = "pan,wheel_zoom,reset,help"

__all__ = (
    'GMap',
    'GMapFigureOptions',
    'gmap'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class GMap(GMapPlot):
    ''' A subclass of :class:`~bokeh.models.plots.Plot` that simplifies plot
    creation with default axes, grids, tools, etc.

    Args:
        google_api_key (str):
            Google requires an API key be supplied for maps to function. See:

            https://developers.google.com/maps/documentation/javascript/get-api-key

        map_options: (GMapOptions)
            Configuration specific to a Google Map

    In addition to all the Bokeh model property attributes documented below,
    the ``Figure`` initializer also accepts the following options, which can
    help simplify configuration:

    .. bokeh-options:: GMapFigureOptions
        :module: bokeh.plotting.figure

    '''

    __subtype__ = "GMap"
    __view_model__ = "GMapPlot"

    def __init__(self, **kw):

        if 'plot_width' in kw and 'width' in kw:
            raise ValueError("Figure called with both 'plot_width' and 'width' supplied, supply only one")
        if 'plot_height' in kw and 'height' in kw:
            raise ValueError("Figure called with both 'plot_height' and 'height' supplied, supply only one")
        if 'height' in kw:
            kw['plot_height'] = kw.pop('height')
        if 'width' in kw:
            kw['plot_width'] = kw.pop('width')

        opts = GMapFigureOptions(kw)

        title = kw.get("title", None)
        if isinstance(title, string_types):
            kw['title'] = Title(text=title)

        super(GMap, self).__init__(x_range=Range1d(), y_range=Range1d(), **kw)

        xf = MercatorTickFormatter(dimension="lon")
        xt = MercatorTicker(dimension="lon")
        self.add_layout(LinearAxis(formatter=xf, ticker=xt), 'below')

        yf = MercatorTickFormatter(dimension="lat")
        yt = MercatorTicker(dimension="lat")
        self.add_layout(LinearAxis(formatter=yf, ticker=yt), 'left')

        tool_objs, tool_map = _process_tools_arg(self, opts.tools)
        self.add_tools(*tool_objs)
        _process_active_tools(self.toolbar, tool_map, opts.active_drag, opts.active_inspect, opts.active_scroll, opts.active_tap)

    annular_wedge = _glyph_function(glyphs.AnnularWedge)

    annulus = _glyph_function(glyphs.Annulus)

    arc = _glyph_function(glyphs.Arc)

    asterisk = _glyph_function(markers.Asterisk)

    bezier = _glyph_function(glyphs.Bezier)

    circle = _glyph_function(markers.Circle)

    circle_cross = _glyph_function(markers.CircleCross)

    circle_x = _glyph_function(markers.CircleX)

    cross = _glyph_function(markers.Cross)

    dash = _glyph_function(markers.Dash)

    diamond = _glyph_function(markers.Diamond)

    diamond_cross = _glyph_function(markers.DiamondCross)

    hbar = _glyph_function(glyphs.HBar)

    ellipse = _glyph_function(glyphs.Ellipse)

    image = _glyph_function(glyphs.Image)

    image_rgba = _glyph_function(glyphs.ImageRGBA)

    image_url = _glyph_function(glyphs.ImageURL)

    inverted_triangle = _glyph_function(markers.InvertedTriangle)

    line = _glyph_function(glyphs.Line)

    multi_line = _glyph_function(glyphs.MultiLine)

    multi_polygons = _glyph_function(glyphs.MultiPolygons)

    oval = _glyph_function(glyphs.Oval)

    patch = _glyph_function(glyphs.Patch)

    patches = _glyph_function(glyphs.Patches)

    quad = _glyph_function(glyphs.Quad)

    quadratic = _glyph_function(glyphs.Quadratic)

    ray = _glyph_function(glyphs.Ray)

    rect = _glyph_function(glyphs.Rect)

    segment = _glyph_function(glyphs.Segment)

    square = _glyph_function(markers.Square)

    square_cross = _glyph_function(markers.SquareCross)

    square_x = _glyph_function(markers.SquareX)

    text = _glyph_function(glyphs.Text)

    triangle = _glyph_function(markers.Triangle)

    vbar = _glyph_function(glyphs.VBar)

    wedge = _glyph_function(glyphs.Wedge)

    x = _glyph_function(markers.X)

def gmap(google_api_key, map_options, **kwargs):
    ''' Create a new :class:`~bokeh.plotting.gmap.GMap` for plotting.

    Args:
        google_api_key (str):
            Google requires an API key be supplied for maps to function. See:

            https://developers.google.com/maps/documentation/javascript/get-api-key

        map_options: (GMapOptions)
            Configuration specific to a Google Map

    In addition to the standard :class:`~bokeh.plotting.gmap.GMap` keyword
    arguments (e.g. ``plot_width`` or ``sizing_mode``), the following
    additional options can be passed as well:

    .. bokeh-options:: GMapFigureOptions
        :module: bokeh.plotting.gmap

    Returns:
       GMap

    '''

    return GMap(api_key=google_api_key, map_options=map_options, **kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

class GMapFigureOptions(Options):

    tools = Either(String, Seq(Either(String, Instance(Tool))), default=DEFAULT_TOOLS, help="""
    Tools the plot should start with.
    """)

    x_minor_ticks = Either(Auto, Int, default="auto", help="""
    Number of minor ticks between adjacent x-axis major ticks.
    """)

    y_minor_ticks = Either(Auto, Int, default="auto", help="""
    Number of minor ticks between adjacent y-axis major ticks.
    """)

    x_axis_location = Enum(VerticalLocation, default="below", help="""
    Where the x-axis should be located.
    """)

    y_axis_location = Enum(HorizontalLocation, default="left", help="""
    Where the y-axis should be located.
    """)

    x_axis_label = String(default="", help="""
    A label for the x-axis.
    """)

    y_axis_label = String(default="", help="""
    A label for the y-axis.
    """)

    active_drag = Either(Auto, String, Instance(Drag), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_inspect = Either(Auto, String, Instance(Inspection), Seq(Instance(Inspection)), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_scroll = Either(Auto, String, Instance(Scroll), default="auto", help="""
    Which scroll tool should initially be active.
    """)

    active_tap = Either(Auto, String, Instance(Tap), default="auto", help="""
    Which tap tool should initially be active.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
