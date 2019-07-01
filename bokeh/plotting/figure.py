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
from ..core.properties import Any, Auto, Either, Enum, Int, List, Seq, Instance, String, Tuple
from ..core.enums import HorizontalLocation, MarkerType, VerticalLocation
from ..models import ColumnDataSource, Plot, Title, Tool, GraphRenderer
from ..models import glyphs as _glyphs
from ..models import markers as _markers
from ..models.tools import Drag, Inspection, Scroll, Tap
from ..util.options import Options
from ..transform import linear_cmap
from .helpers import (
    _get_range, _get_scale, _process_axis_and_grid, _process_tools_arg,
    _glyph_function, _process_active_tools, _single_stack, _double_stack, _graph,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,reset,help"

__all__ = (
    'Figure',
    'figure',
    'FigureOptions',
    'markers'
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Figure(Plot):
    ''' Create a new Figure for plotting.

    A subclass of :class:`~bokeh.models.plots.Plot` that simplifies plot
    creation with default axes, grids, tools, etc.

    Figure objects have many glyph methods that can be used to draw
    vectorized graphical glyphs:

    .. hlist::
        :columns: 3

        * :func:`~bokeh.plotting.figure.Figure.annular_wedge`
        * :func:`~bokeh.plotting.figure.Figure.annulus`
        * :func:`~bokeh.plotting.figure.Figure.arc`
        * :func:`~bokeh.plotting.figure.Figure.asterisk`
        * :func:`~bokeh.plotting.figure.Figure.bezier`
        * :func:`~bokeh.plotting.figure.Figure.circle`
        * :func:`~bokeh.plotting.figure.Figure.circle_cross`
        * :func:`~bokeh.plotting.figure.Figure.circle_x`
        * :func:`~bokeh.plotting.figure.Figure.cross`
        * :func:`~bokeh.plotting.figure.Figure.dash`
        * :func:`~bokeh.plotting.figure.Figure.diamond`
        * :func:`~bokeh.plotting.figure.Figure.diamond_cross`
        * :func:`~bokeh.plotting.figure.Figure.ellipse`
        * :func:`~bokeh.plotting.figure.Figure.harea`
        * :func:`~bokeh.plotting.figure.Figure.hbar`
        * :func:`~bokeh.plotting.figure.Figure.hex`
        * :func:`~bokeh.plotting.figure.Figure.hex_tile`
        * :func:`~bokeh.plotting.figure.Figure.image`
        * :func:`~bokeh.plotting.figure.Figure.image_rgba`
        * :func:`~bokeh.plotting.figure.Figure.image_url`
        * :func:`~bokeh.plotting.figure.Figure.inverted_triangle`
        * :func:`~bokeh.plotting.figure.Figure.line`
        * :func:`~bokeh.plotting.figure.Figure.multi_line`
        * :func:`~bokeh.plotting.figure.Figure.multi_polygons`
        * :func:`~bokeh.plotting.figure.Figure.oval`
        * :func:`~bokeh.plotting.figure.Figure.patch`
        * :func:`~bokeh.plotting.figure.Figure.patches`
        * :func:`~bokeh.plotting.figure.Figure.quad`
        * :func:`~bokeh.plotting.figure.Figure.quadratic`
        * :func:`~bokeh.plotting.figure.Figure.ray`
        * :func:`~bokeh.plotting.figure.Figure.rect`
        * :func:`~bokeh.plotting.figure.Figure.segment`
        * :func:`~bokeh.plotting.figure.Figure.square`
        * :func:`~bokeh.plotting.figure.Figure.square_cross`
        * :func:`~bokeh.plotting.figure.Figure.square_x`
        * :func:`~bokeh.plotting.figure.Figure.step`
        * :func:`~bokeh.plotting.figure.Figure.text`
        * :func:`~bokeh.plotting.figure.Figure.triangle`
        * :func:`~bokeh.plotting.figure.Figure.varea`
        * :func:`~bokeh.plotting.figure.Figure.vbar`
        * :func:`~bokeh.plotting.figure.Figure.wedge`
        * :func:`~bokeh.plotting.figure.Figure.x`

    There is a scatter function that can be parameterized by marker type:

    * :func:`~bokeh.plotting.figure.Figure.scatter`

    There are also specialized methods for stacking bars:

    * bars: :func:`~bokeh.plotting.figure.Figure.hbar_stack`, :func:`~bokeh.plotting.figure.Figure.vbar_stack`
    * lines: :func:`~bokeh.plotting.figure.Figure.hline_stack`, :func:`~bokeh.plotting.figure.Figure.vline_stack`
    * areas: :func:`~bokeh.plotting.figure.Figure.harea_stack`, :func:`~bokeh.plotting.figure.Figure.varea_stack`

    As well as one specialized method for making simple hexbin plots:

    * :func:`~bokeh.plotting.figure.Figure.hexbin`

    In addition to all the ``Figure`` property attributes, the following
    options are also accepted:

    .. bokeh-options:: FigureOptions
        :module: bokeh.plotting.figure

    '''

    __subtype__ = "Figure"
    __view_model__ = "Plot"

    def __init__(self, *arg, **kw):

        if 'plot_width' in kw and 'width' in kw:
            raise ValueError("Figure called with both 'plot_width' and 'width' supplied, supply only one")
        if 'plot_height' in kw and 'height' in kw:
            raise ValueError("Figure called with both 'plot_height' and 'height' supplied, supply only one")
        if 'height' in kw:
            kw['plot_height'] = kw.pop('height')
        if 'width' in kw:
            kw['plot_width'] = kw.pop('width')

        opts = FigureOptions(kw)

        title = kw.get("title", None)
        if isinstance(title, string_types):
            kw['title'] = Title(text=title)

        super(Figure, self).__init__(*arg, **kw)

        self.x_range = _get_range(opts.x_range)
        self.y_range = _get_range(opts.y_range)

        self.x_scale = _get_scale(self.x_range, opts.x_axis_type)
        self.y_scale = _get_scale(self.y_range, opts.y_axis_type)

        _process_axis_and_grid(self, opts.x_axis_type, opts.x_axis_location, opts.x_minor_ticks, opts.x_axis_label, self.x_range, 0)
        _process_axis_and_grid(self, opts.y_axis_type, opts.y_axis_location, opts.y_minor_ticks, opts.y_axis_label, self.y_range, 1)

        tool_objs, tool_map = _process_tools_arg(self, opts.tools, opts.tooltips)
        self.add_tools(*tool_objs)
        _process_active_tools(self.toolbar, tool_map, opts.active_drag, opts.active_inspect, opts.active_scroll, opts.active_tap)

    annular_wedge = _glyph_function(_glyphs.AnnularWedge)

    annulus = _glyph_function(_glyphs.Annulus, """
Examples:

        .. bokeh-plot::
            :source-position: above

            from bokeh.plotting import figure, output_file, show

            plot = figure(plot_width=300, plot_height=300)
            plot.annulus(x=[1, 2, 3], y=[1, 2, 3], color="#7FC97F",
                         inner_radius=0.2, outer_radius=0.5)

            show(plot)

    """)

    arc = _glyph_function(_glyphs.Arc)

    asterisk = _glyph_function(_markers.Asterisk, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.asterisk(x=[1,2,3], y=[1,2,3], size=20, color="#F0027F")

        show(plot)

""")

    bezier = _glyph_function(_glyphs.Bezier)

    circle = _glyph_function(_markers.Circle, """
.. note::
    Only one of ``size`` or ``radius`` should be provided. Note that ``radius``
    defaults to data units.

Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.circle(x=[1, 2, 3], y=[1, 2, 3], size=20)

        show(plot)

""")

    circle_cross = _glyph_function(_markers.CircleCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.circle_cross(x=[1,2,3], y=[4,5,6], size=20,
                          color="#FB8072", fill_alpha=0.2, line_width=2)

        show(plot)

""")

    circle_x = _glyph_function(_markers.CircleX, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.circle_x(x=[1, 2, 3], y=[1, 2, 3], size=20,
                     color="#DD1C77", fill_alpha=0.2)

        show(plot)

""")

    cross = _glyph_function(_markers.Cross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                   color="#E6550D", line_width=2)

        show(plot)

""")

    dash = _glyph_function(_markers.Dash, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.dash(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                  color="#99D594", line_width=2)

        show(plot)

""")

    diamond = _glyph_function(_markers.Diamond, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.diamond(x=[1, 2, 3], y=[1, 2, 3], size=20,
                    color="#1C9099", line_width=2)

        show(plot)

""")

    diamond_cross = _glyph_function(_markers.DiamondCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.diamond_cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                           color="#386CB0", fill_color=None, line_width=2)

        show(plot)

""")

    harea = _glyph_function(_glyphs.HArea, """
    Examples:

   .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.harea(x1=[0, 0, 0], x2=[1, 4, 2], y=[1, 2, 3],
                      fill_color="#99D594")

        show(plot)

    """)

    hbar = _glyph_function(_glyphs.HBar, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.hbar(y=[1, 2, 3], height=0.5, left=0, right=[1,2,3], color="#CAB2D6")

        show(plot)
""")

    ellipse = _glyph_function(_glyphs.Ellipse, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.ellipse(x=[1, 2, 3], y=[1, 2, 3], width=30, height=20,
                     color="#386CB0", fill_color=None, line_width=2)

        show(plot)

""")

    hex = _glyph_function(_markers.Hex, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.hex(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)

""")

    hex_tile = _glyph_function(_glyphs.HexTile, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300, match_aspect=True)
        plot.hex_tile(r=[0, 0, 1], q=[1, 2, 2], fill_color="#74ADD1")

        show(plot)

""")

    image = _glyph_function(_glyphs.Image, """
.. note::
    If both ``palette`` and ``color_mapper`` are passed, a ``ValueError``
    exception will be raised. If neither is passed, then the ``Greys9``
    palette will be used as a default.

""")

    image_rgba = _glyph_function(_glyphs.ImageRGBA, """
.. note::
    The ``image_rgba`` method accepts images as a two-dimensional array of RGBA
    values (encoded as 32-bit integers).

""")

    image_url = _glyph_function(_glyphs.ImageURL)

    inverted_triangle = _glyph_function(_markers.InvertedTriangle, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.inverted_triangle(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#DE2D26")

        show(plot)

""")

    line = _glyph_function(_glyphs.Line, """
Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(title="line", plot_width=300, plot_height=300)
       p.line(x=[1, 2, 3, 4, 5], y=[6, 7, 2, 4, 5])

       show(p)

""")

    multi_line = _glyph_function(_glyphs.MultiLine, """
.. note::
    For this glyph, the data is not simply an array of scalars, it is an
    "array of arrays".

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.multi_line(xs=[[1, 2, 3], [2, 3, 4]], ys=[[6, 7, 2], [4, 5, 7]],
                    color=['red','green'])

       show(p)

""")

    multi_polygons = _glyph_function(_glyphs.MultiPolygons, """
.. note::
    For this glyph, the data is not simply an array of scalars, it is a
    nested array.

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.multi_polygons(xs=[[[[1, 1, 2, 2]]], [[[1, 1, 3], [1.5, 1.5, 2]]]],
                        ys=[[[[4, 3, 3, 4]]], [[[1, 3, 1], [1.5, 2, 1.5]]]],
                        color=['red', 'green'])
       show(p)

""")

    oval = _glyph_function(_glyphs.Oval, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.oval(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=0.4,
                  angle=-0.7, color="#1D91C0")

        show(plot)

""")

    patch = _glyph_function(_glyphs.Patch, """
Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.patch(x=[1, 2, 3, 2], y=[6, 7, 2, 2], color="#99d8c9")

       show(p)

""")

    patches = _glyph_function(_glyphs.Patches, """
.. note::
    For this glyph, the data is not simply an array of scalars, it is an
    "array of arrays".

Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.patches(xs=[[1,2,3],[4,5,6,5]], ys=[[1,2,1],[4,5,5,4]],
                 color=["#43a2ca", "#a8ddb5"])

       show(p)

""")

    quad = _glyph_function(_glyphs.Quad, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
                  right=[1.2, 2.5, 3.7], color="#B3DE69")

        show(plot)

""")

    quadratic = _glyph_function(_glyphs.Quadratic)

    ray = _glyph_function(_glyphs.Ray, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=-0.7, color="#FB8072",
                 line_width=2)

        show(plot)

""")

    rect = _glyph_function(_glyphs.Rect, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.rect(x=[1, 2, 3], y=[1, 2, 3], width=10, height=20, color="#CAB2D6",
                  width_units="screen", height_units="screen")

        show(plot)

""")

    step = _glyph_function(_glyphs.Step, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.step(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 2, 5], color="#FB8072")

        show(plot)

""")


    segment = _glyph_function(_glyphs.Segment, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.segment(x0=[1, 2, 3], y0=[1, 2, 3], x1=[1, 2, 3],
                     y1=[1.2, 2.5, 3.7], color="#F4A582",
                     line_width=3)

        show(plot)

""")

    square = _glyph_function(_markers.Square, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)

""")

    square_cross = _glyph_function(_markers.SquareCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square_cross(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                          color="#7FC97F",fill_color=None, line_width=2)

        show(plot)

""")

    square_x = _glyph_function(_markers.SquareX, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square_x(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                      color="#FDAE6B",fill_color=None, line_width=2)

        show(plot)

""")

    text = _glyph_function(_glyphs.Text, """
.. note::
    The location and angle of the text relative to the ``x``, ``y`` coordinates
    is indicated by the alignment and baseline text properties.

Returns:
    GlyphRenderer

""")

    triangle = _glyph_function(_markers.Triangle, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.triangle(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                      color="#99D594", line_width=2)

        show(plot)

""")

    varea = _glyph_function(_glyphs.VArea, """
Examples:

   .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.varea(x=[1, 2, 3], y1=[0, 0, 0], y2=[1, 4, 2],
                   fill_color="#99D594")

        show(plot)

""")

    vbar = _glyph_function(_glyphs.VBar, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.vbar(x=[1, 2, 3], width=0.5, bottom=0, top=[1,2,3], color="#CAB2D6")

        show(plot)

""")

    wedge = _glyph_function(_glyphs.Wedge, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=15, start_angle=0.6,
                   end_angle=4.1, radius_units="screen", color="#2b8cbe")

        show(plot)

""")

    x = _glyph_function(_markers.X, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.x(x=[1, 2, 3], y=[1, 2, 3], size=[10, 20, 25], color="#fa9fb5")

        show(plot)

""")

    # -------------------------------------------------------------------------

    _scatter = _glyph_function(_markers.Scatter)

    def scatter(self, *args, **kwargs):
        ''' Creates a scatter plot of the given x and y items.

        Args:
            x (str or seq[float]) : values or field names of center x coordinates

            y (str or seq[float]) : values or field names of center y coordinates

            size (str or list[float]) : values or field names of sizes in screen units

            marker (str, or list[str]): values or field names of marker types

            color (color value, optional): shorthand to set both fill and line color

            source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source.
                An attempt will be made to convert the object to :class:`~bokeh.models.sources.ColumnDataSource`
                if needed. If none is supplied, one is created for the user automatically.

            **kwargs: :ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`

        Examples:

            >>> p.scatter([1,2,3],[4,5,6], marker="square", fill_color="red")
            >>> p.scatter("data1", "data2", marker="mtype", source=data_source, ...)

        .. note::
            When passing ``marker="circle"`` it is also possible to supply a
            ``radius`` value in data-space units. When configuring marker type
            from a data source column, *all* markers incuding circles may only
            be configured with ``size`` in screen units.

        '''
        marker_type = kwargs.pop("marker", "circle")

        if isinstance(marker_type, string_types) and marker_type in _MARKER_SHORTCUTS:
            marker_type = _MARKER_SHORTCUTS[marker_type]

        # The original scatter implementation allowed circle scatters to set a
        # radius. We will leave this here for compatibility but note that it
        # only works when the marker type is "circle" (and not referencing a
        # data source column). Consider deprecating in the future.
        if marker_type == "circle" and "radius" in kwargs:
            return self.circle(*args, **kwargs)
        else:
            return self._scatter(*args, marker=marker_type, **kwargs)

    def hexbin(self, x, y, size, orientation="pointytop", palette="Viridis256", line_color=None, fill_color=None, aspect_scale=1, **kwargs):
        ''' Perform a simple equal-weight hexagonal binning.

        A :class:`~bokeh.models._glyphs.HexTile` glyph will be added to display
        the binning. The :class:`~bokeh.models.sources.ColumnDataSource` for
        the glyph will have columns ``q``, ``r``, and ``count``, where ``q``
        and ``r`` are `axial coordinates`_ for a tile, and ``count`` is the
        associated bin count.

        It is often useful to set ``match_aspect=True`` on the associated plot,
        so that hexagonal tiles are all regular (i.e. not "stretched") in
        screen space.

        For more sophisticated use-cases, e.g. weighted binning or individually
        scaling hex tiles, use :func:`hex_tile` directly, or consider a higher
        level library such as HoloViews.

        Args:
            x (array[float]) :
                A NumPy array of x-coordinates to bin into hexagonal tiles.

            y (array[float]) :
                A NumPy array of y-coordinates to bin into hexagonal tiles

            size (float) :
                The size of the hexagonal tiling to use. The size is defined as
                distance from the center of a hexagon to a corner.

                In case the aspect scaling is not 1-1, then specifically `size`
                is the distance from the center to the "top" corner with the
                `"pointytop"` orientation, and the distance from the center to
                a "side" corner with the "flattop" orientation.

            orientation ("pointytop" or "flattop", optional) :
                Whether the hexagonal tiles should be oriented with a pointed
                corner on top, or a flat side on top. (default: "pointytop")

            palette (str or seq[color], optional) :
                A palette (or palette name) to use to colormap the bins according
                to count. (default: 'Viridis256')

                If ``fill_color`` is supplied, it overrides this value.

            line_color (color, optional) :
                The outline color for hex tiles, or None (default: None)

            fill_color (color, optional) :
                An optional fill color for hex tiles, or None. If None, then
                the ``palette`` will be used to color map the tiles by
                count. (default: None)

            aspect_scale (float) :
                Match a plot's aspect ratio scaling.

                When working with a plot with ``aspect_scale != 1``, this
                parameter can be set to match the plot, in order to draw
                regular hexagons (instead of "stretched" ones).

                This is roughly equivalent to binning in "screen space", and
                it may be better to use axis-aligned rectangular bins when
                plot aspect scales are not one.

        Any additional keyword arguments are passed to :func:`hex_tile`.

        Returns
            (Glyphrender, DataFrame)
                A tuple with the ``HexTile`` renderer generated to display the
                binning, and a Pandas ``DataFrame`` with columns ``q``, ``r``,
                and ``count``, where ``q`` and ``r`` are `axial coordinates`_
                for a tile, and ``count`` is the associated bin count.

        Example:

            .. bokeh-plot::
                :source-position: above

                import numpy as np
                from bokeh.models import HoverTool
                from bokeh.plotting import figure, show

                x = 2 + 2*np.random.standard_normal(500)
                y = 2 + 2*np.random.standard_normal(500)

                p = figure(match_aspect=True, tools="wheel_zoom,reset")
                p.background_fill_color = '#440154'
                p.grid.visible = False

                p.hexbin(x, y, size=0.5, hover_color="pink", hover_alpha=0.8)

                hover = HoverTool(tooltips=[("count", "@c"), ("(q,r)", "(@q, @r)")])
                p.add_tools(hover)

                show(p)

        .. _axial coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates-axial

        '''
        from ..util.hex import hexbin

        bins = hexbin(x, y, size, orientation, aspect_scale=aspect_scale)

        if fill_color is None:
            fill_color = linear_cmap('c', palette, 0, max(bins.counts))

        source = ColumnDataSource(data=dict(q=bins.q, r=bins.r, c=bins.counts))

        r = self.hex_tile(q="q", r="r", size=size, orientation=orientation, aspect_scale=aspect_scale,
                          source=source, line_color=line_color, fill_color=fill_color, **kwargs)

        return (r, bins)

    def harea_stack(self, stackers, **kw):
        ''' Generate multiple ``HArea`` renderers for levels stacked left
        to right.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``x1`` and ``x2`` harea coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``harea``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``harea_stack`` will
            will create two ``HArea`` renderers that stack:

            .. code-block:: python

                p.harea_stack(['2016', '2017'], y='y', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.harea(x1=stack(),       x2=stack('2016'),         y='y', color='blue', source=source, name='2016')
                p.harea(x1=stack('2016'), x2=stack('2016', '2017'), y='y', color='red',  source=source, name='2017')

        '''
        result = []
        for kw in _double_stack(stackers, "x1", "x2", **kw):
            result.append(self.harea(**kw))
        return result

    def hbar_stack(self, stackers, **kw):
        ''' Generate multiple ``HBar`` renderers for levels stacked left to right.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``left`` and ``right`` bar coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``hbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2106* and *2017*, then the following call to ``hbar_stack`` will
            will create two ``HBar`` renderers that stack:

            .. code-block:: python

                p.hbar_stack(['2016', '2017'], x=10, width=0.9, color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.hbar(bottom=stack(),       top=stack('2016'),         x=10, width=0.9, color='blue', source=source, name='2016')
                p.hbar(bottom=stack('2016'), top=stack('2016', '2017'), x=10, width=0.9, color='red',  source=source, name='2017')

        '''
        result = []
        for kw in _double_stack(stackers, "left", "right", **kw):
            result.append(self.hbar(**kw))
        return result

    def _line_stack(self, x, y, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked vertically
        or horizontally.

        Args:
            x (seq[str]) :

            y (seq[str]) :

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``hbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2106* and *2017*, then the following call to ``line_stack`` with
            stackers for the y-coordinates will will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.line_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        if all(isinstance(val, (list, tuple)) for val in (x,y)):
            raise ValueError("Only one of x or y may be a list of stackers")

        result = []

        if isinstance(y, (list, tuple)):
            kw['x'] = x
            for kw in _single_stack(y, "y", **kw):
                result.append(self.line(**kw))
            return result

        if isinstance(x, (list, tuple)):
            kw['y'] = y
            for kw in _single_stack(x, "x", **kw):
                result.append(self.line(**kw))
            return result

        return [self.line(x, y, **kw)]

    def hline_stack(self, stackers, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked horizontally.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``x`` line coordinates.

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``line``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2106* and *2017*, then the following call to ``hline_stack`` with
            stackers for the x-coordinates will will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.hline_stack(['2016', '2017'], y='y', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(x=stack('2016'),         y='y', color='blue', source=source, name='2016')
                p.line(x=stack('2016', '2017'), y='y', color='red',  source=source, name='2017')

        '''
        return self._line_stack(x=stackers, **kw)

    def varea_stack(self, stackers, **kw):
        ''' Generate multiple ``VArea`` renderers for levels stacked bottom
        to top.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``y1`` and ``y1`` varea coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``varea``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``varea_stack`` will
            will create two ``VArea`` renderers that stack:

            .. code-block:: python

                p.varea_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.varea(y1=stack(),       y2=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.varea(y1=stack('2016'), y2=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        result = []
        for kw in _double_stack(stackers, "y1", "y2", **kw):
            result.append(self.varea(**kw))
        return result

    def vbar_stack(self, stackers, **kw):
        ''' Generate multiple ``VBar`` renderers for levels stacked bottom
        to top.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``left`` and ``right`` bar coordinates.

                Additionally, the ``name`` of the renderer will be set to
                the value of each successive stacker (this is useful with the
                special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``vbar``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2016* and *2017*, then the following call to ``vbar_stack`` will
            will create two ``VBar`` renderers that stack:

            .. code-block:: python

                p.vbar_stack(['2016', '2017'], x=10, width=0.9, color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.vbar(bottom=stack(),       top=stack('2016'),         x=10, width=0.9, color='blue', source=source, name='2016')
                p.vbar(bottom=stack('2016'), top=stack('2016', '2017'), x=10, width=0.9, color='red',  source=source, name='2017')

        '''
        result = []
        for kw in _double_stack(stackers, "bottom", "top", **kw):
            result.append(self.vbar(**kw))
        return result

    def vline_stack(self, stackers, **kw):
        ''' Generate multiple ``Line`` renderers for lines stacked vertically.

        Args:
            stackers (seq[str]) : a list of data source field names to stack
                successively for ``y`` line coordinates.

        Additionally, the ``name`` of the renderer will be set to
        the value of each successive stacker (this is useful with the
        special hover variable ``$name``)

        Any additional keyword arguments are passed to each call to ``line``.
        If a keyword value is a list or tuple, then each call will get one
        value from the sequence.

        Returns:
            list[GlyphRenderer]

        Examples:

            Assuming a ``ColumnDataSource`` named ``source`` with columns
            *2106* and *2017*, then the following call to ``vline_stack`` with
            stackers for the y-coordinates will will create two ``Line``
            renderers that stack:

            .. code-block:: python

                p.vline_stack(['2016', '2017'], x='x', color=['blue', 'red'], source=source)

            This is equivalent to the following two separate calls:

            .. code-block:: python

                p.line(y=stack('2016'),         x='x', color='blue', source=source, name='2016')
                p.line(y=stack('2016', '2017'), x='x', color='red',  source=source, name='2017')

        '''
        return self._line_stack(y=stackers, **kw)

    def graph(self, node_source, edge_source, layout_provider, **kwargs):
        ''' Creates a network graph using the given node, edge and layout provider.

        Args:
            node_source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source
                for the graph nodes. An attempt will be made to convert the object to
                :class:`~bokeh.models.sources.ColumnDataSource` if needed. If none is supplied, one is created
                for the user automatically.

            edge_source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source
                for the graph edges. An attempt will be made to convert the object to
                :class:`~bokeh.models.sources.ColumnDataSource` if needed. If none is supplied, one is created
                for the user automatically.

            layout_provider (:class:`~bokeh.models.graphs.LayoutProvider`) : a ``LayoutProvider`` instance to
                provide the graph coordinates in Cartesian space.

            **kwargs: :ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`

        '''
        kw = _graph(node_source, edge_source, **kwargs)
        graph_renderer = GraphRenderer(layout_provider=layout_provider, **kw)
        self.renderers.append(graph_renderer)
        return graph_renderer

def figure(**kwargs):
    return Figure(**kwargs)
figure.__doc__ = Figure.__doc__

_MARKER_SHORTCUTS = {
    "*"  : "asterisk",
    "+"  : "cross",
    "o"  : "circle",
    "ox" : "circle_x",
    "o+" : "circle_cross",
    "-"  : "dash",
    "v"  : "inverted_triangle",
    "^"  : "triangle",
}

def markers():
    ''' Prints a list of valid marker types for scatter()

    Returns:
        None
    '''
    print("Available markers: \n\n - " + "\n - ".join(list(MarkerType)))
    print()
    print("Shortcuts: \n\n" + "\n".join(" %r: %s" % item for item in _MARKER_SHORTCUTS.items()))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

# This class itself is intentionally undocumented (it is used to generate
# documentation elsewhere)
class FigureOptions(Options):

    tools = Either(String, Seq(Either(String, Instance(Tool))), default=DEFAULT_TOOLS, help="""
    Tools the plot should start with.
    """)

    x_range = Any(help="""
    Customize the x-range of the plot.
    """)

    y_range = Any(help="""
    Customize the x-range of the plot.
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

    x_axis_type = Either(Auto, Enum("linear", "log", "datetime", "mercator"), default="auto", help="""
    The type of the x-axis.
    """)

    y_axis_type = Either(Auto, Enum("linear", "log", "datetime", "mercator"), default="auto", help="""
    The type of the y-axis.
    """)

    tooltips = Either(String, List(Tuple(String, String)), help="""
    An optional argument to configure tooltips for the Figure. This argument
    accepts the same values as the ``HoverTool.tooltips`` property. If a hover
    tool is specified in the ``tools`` argument, this value will override that
    hover tools ``tooltips`` value. If no hover tool is specified in the
    ``tools`` argument, then passing tooltips here will cause one to be created
    and added.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_color_fields = set(["color", "fill_color", "line_color"])
_alpha_fields = set(["alpha", "fill_alpha", "line_alpha"])

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
