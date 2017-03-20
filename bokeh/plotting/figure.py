from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

from six import string_types

from ..core.properties import Auto, Either, Enum, Float, Int, Seq, Instance, String, Tuple
from ..core.enums import HorizontalLocation, VerticalLocation
from ..models import Plot, Range, Title, Tool
from ..models import glyphs, markers
from ..util.options import Options
from ..util._plot_arg_helpers import _convert_responsive
from .helpers import _get_range, _process_axis_and_grid, _process_tools_arg, _glyph_function, _process_active_tools

DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,reset,help"


class FigureOptions(Options):

    tools = Either(String, Seq(Either(String, Instance(Tool))), default=DEFAULT_TOOLS, help="""
    Tools the plot should start with.
    """)

    x_range = Either(Tuple(Float, Float), Seq(String), Instance(Range), help="""
    Customize the x-range of the plot.
    """)

    y_range = Either(Tuple(Float, Float), Seq(String), Instance(Range), help="""
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

    active_drag = Either(Auto, String, Instance(Tool), default="auto", help="""
    Which drag tool should initially be active.
    """)

    active_scroll = Either(Auto, String, Instance(Tool), default="auto", help="""
    Which scroll tool should initially be active.
    """)

    active_tap = Either(Auto, String, Instance(Tool), default="auto", help="""
    Which tap tool should initially be active.
    """)

    x_axis_type = Either(Auto, Enum("linear", "log", "datetime"), default="auto", help="""
    The type of the x-axis.
    """)

    y_axis_type = Either(Auto, Enum("linear", "log", "datetime"), default="auto", help="""
    The type of the y-axis.
    """)

class Figure(Plot):
    ''' A subclass of :class:`~bokeh.models.plots.Plot` that simplifies plot
    creation with default axes, grids, tools, etc.

    In addition to all the Bokeh model property attributes documented below,
    the ``Figure`` initializer also accepts the following options, which can
    help simplify configuration:

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

        if 'responsive' in kw and 'sizing_mode' in kw:
            raise ValueError("Figure called with both 'responsive' and 'sizing_mode' supplied, supply only one")
        if 'responsive' in kw:
            kw['sizing_mode'] = _convert_responsive(kw['responsive'])
            del kw['responsive']

        opts = FigureOptions(kw)

        title = kw.get("title", None)
        if isinstance(title, string_types):
            kw['title'] = Title(text=title)

        super(Figure, self).__init__(*arg, **kw)

        self.x_range = _get_range(opts.x_range)
        self.y_range = _get_range(opts.y_range)

        _process_axis_and_grid(self, opts.x_axis_type, opts.x_axis_location, opts.x_minor_ticks, opts.x_axis_label, self.x_range, 0)
        _process_axis_and_grid(self, opts.y_axis_type, opts.y_axis_location, opts.y_minor_ticks, opts.y_axis_label, self.y_range, 1)

        tool_objs, tool_map = _process_tools_arg(self, opts.tools)
        self.add_tools(*tool_objs)
        _process_active_tools(self.toolbar, tool_map, opts.active_drag, opts.active_scroll, opts.active_tap)

    annular_wedge = _glyph_function(glyphs.AnnularWedge)

    annulus = _glyph_function(glyphs.Annulus, """
Examples:

        .. bokeh-plot::
            :source-position: above

            from bokeh.plotting import figure, output_file, show

            plot = figure(plot_width=300, plot_height=300)
            plot.annulus(x=[1, 2, 3], y=[1, 2, 3], color="#7FC97F",
                         inner_radius=0.2, outer_radius=0.5)

            show(plot)

    """)

    arc = _glyph_function(glyphs.Arc)

    asterisk = _glyph_function(markers.Asterisk, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.asterisk(x=[1,2,3], y=[1,2,3], size=20, color="#F0027F")

        show(plot)

""")

    bezier = _glyph_function(glyphs.Bezier)

    circle = _glyph_function(markers.Circle, """
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

    circle_cross = _glyph_function(markers.CircleCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.circle_cross(x=[1,2,3], y=[4,5,6], size=20,
                          color="#FB8072", fill_alpha=0.2, line_width=2)

        show(plot)

""")

    circle_x = _glyph_function(markers.CircleX, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.circle_x(x=[1, 2, 3], y=[1, 2, 3], size=20,
                     color="#DD1C77", fill_alpha=0.2)

        show(plot)

""")

    cross = _glyph_function(markers.Cross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                   color="#E6550D", line_width=2)

        show(plot)

""")

    diamond = _glyph_function(markers.Diamond, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.diamond(x=[1, 2, 3], y=[1, 2, 3], size=20,
                    color="#1C9099", line_width=2)

        show(plot)

""")

    diamond_cross = _glyph_function(markers.DiamondCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.diamond_cross(x=[1, 2, 3], y=[1, 2, 3], size=20,
                           color="#386CB0", fill_color=None, line_width=2)

        show(plot)

""")

    hbar = _glyph_function(glyphs.HBar, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.hbar(y=[1, 2, 3], height=0.5, left=0, right=[1,2,3], color="#CAB2D6")

        show(plot)
""")

    ellipse = _glyph_function(glyphs.Ellipse, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.ellipse(x=[1, 2, 3], y=[1, 2, 3], width=30, height=20,
                     color="#386CB0", fill_color=None, line_width=2)

        show(plot)

""")

    image = _glyph_function(glyphs.Image, """
.. note::
    If both ``palette`` and ``color_mapper`` are passed, a ``ValueError``
    exception will be raised. If neither is passed, then the ``Greys9``
    palette will be used as a default.

""")

    image_rgba = _glyph_function(glyphs.ImageRGBA, """
.. note::
    The ``image_rgba`` method accepts images as a two-dimensional array of RGBA
    values (encoded as 32-bit integers).

""")

    image_url = _glyph_function(glyphs.ImageURL)

    inverted_triangle = _glyph_function(markers.InvertedTriangle, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.inverted_triangle(x=[1, 2, 3], y=[1, 2, 3], size=20, color="#DE2D26")

        show(plot)

""")

    line = _glyph_function(glyphs.Line, """
Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(title="line", plot_width=300, plot_height=300)
       p.line(x=[1, 2, 3, 4, 5], y=[6, 7, 2, 4, 5])

       show(p)

""")

    multi_line = _glyph_function(glyphs.MultiLine, """
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

    oval = _glyph_function(glyphs.Oval, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.oval(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=0.4,
                  angle=-0.7, color="#1D91C0")

        show(plot)

""")

    patch = _glyph_function(glyphs.Patch, """
Examples:

    .. bokeh-plot::
       :source-position: above

       from bokeh.plotting import figure, output_file, show

       p = figure(plot_width=300, plot_height=300)
       p.patch(x=[1, 2, 3, 2], y=[6, 7, 2, 2], color="#99d8c9")

       show(p)

""")

    patches = _glyph_function(glyphs.Patches, """
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

    quad = _glyph_function(glyphs.Quad, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
            right=[1.2, 2.5, 3.7], color="#B3DE69")

        show(plot)

""")

    quadratic = _glyph_function(glyphs.Quadratic)

    ray = _glyph_function(glyphs.Ray, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=-0.7, color="#FB8072",
                 line_width=2)

        show(plot)

""")

    rect = _glyph_function(glyphs.Rect, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.rect(x=[1, 2, 3], y=[1, 2, 3], width=10, height=20, color="#CAB2D6",
            width_units="screen", height_units="screen")

        show(plot)

""")

    segment = _glyph_function(glyphs.Segment, """
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

    square = _glyph_function(markers.Square, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,30], color="#74ADD1")

        show(plot)

""")

    square_cross = _glyph_function(markers.SquareCross, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square_cross(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                         color="#7FC97F",fill_color=None, line_width=2)

        show(plot)

""")

    square_x = _glyph_function(markers.SquareX, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.square_x(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                     color="#FDAE6B",fill_color=None, line_width=2)

        show(plot)

""")

    text = _glyph_function(glyphs.Text, """
.. note::
    The location and angle of the text relative to the ``x``, ``y`` coordinates
    is indicated by the alignment and baseline text properties.

Returns:
    GlyphRenderer

""")

    triangle = _glyph_function(markers.Triangle, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.triangle(x=[1, 2, 3], y=[1, 2, 3], size=[10,20,25],
                     color="#99D594", line_width=2)

        show(plot)

""")

    vbar = _glyph_function(glyphs.VBar, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.vbar(x=[1, 2, 3], width=0.5, bottom=0, top=[1,2,3], color="#CAB2D6")

        show(plot)

""")

    wedge = _glyph_function(glyphs.Wedge, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=15, start_angle=0.6,
                     end_angle=4.1, radius_units="screen", color="#2b8cbe")

        show(plot)

""")

    x = _glyph_function(markers.X, """
Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.plotting import figure, output_file, show

        plot = figure(plot_width=300, plot_height=300)
        plot.x(x=[1, 2, 3], y=[1, 2, 3], size=[10, 20, 25], color="#fa9fb5")

        show(plot)

""")

    def scatter(self, *args, **kwargs):
        """ Creates a scatter plot of the given x and y items.

        Args:
            x (str or seq[float]) : values or field names of center x coordinates
            y (str or seq[float]) : values or field names of center y coordinates
            size (str or list[float]) : values or field names of sizes in screen units
            marker (str, optional): a valid marker_type, defaults to "circle"
            color (color value, optional): shorthand to set both fill and line color
            source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source.
                An attempt will be made to convert the object to :class:`~bokeh.models.sources.ColumnDataSource`
                if needed. If none is supplied, one is created for the user automatically.
            **kwargs: :ref:`userguide_styling_line_properties` and :ref:`userguide_styling_fill_properties`

        Examples:

            >>> p.scatter([1,2,3],[4,5,6], fill_color="red")
            >>> p.scatter("data1", "data2", source=data_source, ...)

        """
        markertype = kwargs.pop("marker", "circle")

        if markertype not in _marker_types:
            raise ValueError("Invalid marker type '%s'. Use markers() to see a list of valid marker types." % markertype)

        # TODO (bev) make better when plotting.scatter is removed
        conversions = {
            "*": "asterisk",
            "+": "cross",
            "o": "circle",
            "ox": "circle_x",
            "o+": "circle_cross"
        }
        if markertype in conversions:
            markertype = conversions[markertype]

        return getattr(self, markertype)(*args, **kwargs)


def figure(**kwargs):
    ''' Create a new :class:`~bokeh.plotting.figure.Figure` for plotting.

    In addition to the standard :class:`~bokeh.plotting.figure.Figure`
    property values (e.g. ``plot_width`` or ``sizing_mode``) the following
    additional options can be passed as well:

    .. bokeh-options:: FigureOptions
        :module: bokeh.plotting.figure

    Returns:
       Figure

    '''

    return Figure(**kwargs)


_marker_types = [
    "asterisk",
    "circle",
    "circle_cross",
    "circle_x",
    "cross",
    "diamond",
    "diamond_cross",
    "inverted_triangle",
    "square",
    "square_x",
    "square_cross",
    "triangle",
    "x",
    "*",
    "+",
    "o",
    "ox",
    "o+",
]

def markers():
    """ Prints a list of valid marker types for scatter()

    Returns:
        None
    """
    print("Available markers: \n - " + "\n - ".join(_marker_types))

_color_fields = set(["color", "fill_color", "line_color"])
_alpha_fields = set(["alpha", "fill_alpha", "line_alpha"])
