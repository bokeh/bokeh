#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import HorizontalLocation, VerticalLocation
from ..core.properties import Auto, Either, Enum, Instance, Int, Seq, String
from ..models import (
    GMapPlot,
    LinearAxis,
    MercatorTicker,
    MercatorTickFormatter,
    Range1d,
    Title,
    Tool,
)
from ..models.tools import Drag, Inspection, Scroll, Tap
from ..util.options import Options
from ._tools import process_active_tools, process_tools_arg
from .figure import Figure

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
        if isinstance(title, str):
            kw['title'] = Title(text=title)

        super().__init__(x_range=Range1d(), y_range=Range1d(), **kw)

        xf = MercatorTickFormatter(dimension="lon")
        xt = MercatorTicker(dimension="lon")
        self.add_layout(LinearAxis(formatter=xf, ticker=xt), 'below')

        yf = MercatorTickFormatter(dimension="lat")
        yt = MercatorTicker(dimension="lat")
        self.add_layout(LinearAxis(formatter=yf, ticker=yt), 'left')

        tool_objs, tool_map = process_tools_arg(self, opts.tools)
        self.add_tools(*tool_objs)
        process_active_tools(self.toolbar, tool_map, opts.active_drag, opts.active_inspect, opts.active_scroll, opts.active_tap)


    annular_wedge = Figure.annular_wedge

    annulus = Figure.annulus

    arc = Figure.arc

    asterisk = Figure.asterisk

    bezier = Figure.bezier

    circle = Figure.circle

    circle_cross = Figure.circle_cross

    circle_x = Figure.circle_x

    cross = Figure.cross

    dash = Figure.dash

    diamond = Figure.diamond

    diamond_cross = Figure.diamond_cross

    graph = Figure.graph

    harea = Figure.harea

    harea_stack = Figure.harea_stack

    hbar = Figure.hbar

    hbar_stack = Figure.hbar_stack

    hline_stack = Figure.hline_stack

    ellipse = Figure.ellipse

    hex = Figure.hex

    hexbin = Figure.hexbin

    hex_tile = Figure.hex_tile

    image = Figure.image

    image_rgba = Figure.image_rgba

    image_url = Figure.image_url

    inverted_triangle = Figure.inverted_triangle

    line = Figure.line

    multi_line = Figure.multi_line

    multi_polygons = Figure.multi_polygons

    oval = Figure.oval

    patch = Figure.patch

    patches = Figure.patches

    quad = Figure.quad

    quadratic = Figure.quadratic

    ray = Figure.ray

    rect = Figure.rect

    step = Figure.step

    scatter = Figure.scatter

    segment = Figure.segment

    square = Figure.square

    square_cross = Figure.square_cross

    square_x = Figure.square_x

    text = Figure.text

    triangle = Figure.triangle

    varea = Figure.varea

    varea_stack = Figure.varea_stack

    vbar = Figure.vbar

    vbar_stack = Figure.vbar_stack

    vline_stack = Figure.vline_stack

    wedge = Figure.wedge

    x = Figure.x

def gmap(google_api_key, map_options, **kwargs):
    ''' Create a new :class:`~bokeh.plotting.gmap.GMap` for plotting.

    Args:
        google_api_key (str):
            Google requires an API key be supplied for maps to function. See:

            https://developers.google.com/maps/documentation/javascript/get-api-key

            The Google API key will be stored in the Bokeh Document JSON.

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
