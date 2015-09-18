from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

from . import _glyph_functions as gf
from .models import Axis, Grid, GridPlot, Legend, LogAxis, Plot
from .plotting_helpers import (
    _list_attr_splat, _get_range, _get_axis_class, _get_num_minor_ticks, _process_tools_arg
)

# extra imports -- just things to add to 'from plotting import *'
from .document import Document
from .models import ColumnDataSource
from .session import Session
from .io import (
    curdoc, cursession, output_file, output_notebook, output_server, push,
    reset_output, save, show, gridplot, hplot, vplot)

# Names that we want in this namespace (fool pyflakes)
(GridPlot, Document, ColumnDataSource, Session, cursession, gridplot,
show, save, reset_output, push, output_file, output_notebook,
output_server, vplot, hplot)


DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,resize,reset,help"

class Figure(Plot):
    ''' A subclass of :class:`~bokeh.models.plots.Plot` that simplifies plot
    creation with default axes, grids, tools, etc.

    '''

    __subtype__ = "Figure"
    __view_model__ = "Plot"

    def __init__(self, *arg, **kw):

        tools = kw.pop("tools", DEFAULT_TOOLS)

        x_range = kw.pop("x_range", None)
        y_range = kw.pop("y_range", None)

        x_axis_type = kw.pop("x_axis_type", "auto")
        y_axis_type = kw.pop("y_axis_type", "auto")

        x_minor_ticks = kw.pop('x_minor_ticks', 'auto')
        y_minor_ticks = kw.pop('y_minor_ticks', 'auto')

        x_axis_location = kw.pop("x_axis_location", "below")
        y_axis_location = kw.pop("y_axis_location", "left")

        x_axis_label = kw.pop("x_axis_label", "")
        y_axis_label = kw.pop("y_axis_label", "")

        super(Figure, self).__init__(*arg, **kw)

        self.x_range = _get_range(x_range)
        self.y_range = _get_range(y_range)

        x_axiscls = _get_axis_class(x_axis_type, self.x_range)
        if x_axiscls:
            if x_axiscls is LogAxis:
                self.x_mapper_type = 'log'
            xaxis = x_axiscls(plot=self)
            xaxis.ticker.num_minor_ticks = _get_num_minor_ticks(x_axiscls, x_minor_ticks)
            axis_label = x_axis_label
            if axis_label:
                xaxis.axis_label = axis_label
            xgrid = Grid(plot=self, dimension=0, ticker=xaxis.ticker); xgrid
            if x_axis_location == "above":
                self.above.append(xaxis)
            elif x_axis_location == "below":
                self.below.append(xaxis)

        y_axiscls = _get_axis_class(y_axis_type, self.y_range)
        if y_axiscls:
            if y_axiscls is LogAxis:
                self.y_mapper_type = 'log'
            yaxis = y_axiscls(plot=self)
            yaxis.ticker.num_minor_ticks = _get_num_minor_ticks(y_axiscls, y_minor_ticks)
            axis_label = y_axis_label
            if axis_label:
                yaxis.axis_label = axis_label
            ygrid = Grid(plot=self, dimension=1, ticker=yaxis.ticker); ygrid
            if y_axis_location == "left":
                self.left.append(yaxis)
            elif y_axis_location == "right":
                self.right.append(yaxis)

        tool_objs = _process_tools_arg(self, tools)
        self.add_tools(*tool_objs)

    def _axis(self, *sides):
        objs = []
        for s in sides:
            objs.extend(getattr(self, s, []))
        axis = [obj for obj in objs if isinstance(obj, Axis)]
        return _list_attr_splat(axis)

    @property
    def xaxis(self):
        """ Splattable list of :class:`~bokeh.models.axes.Axis` objects for the x dimension.

        """
        return self._axis("above", "below")

    @property
    def yaxis(self):
        """ Splattable list of :class:`~bokeh.models.axes.Axis` objects for the y dimension.

        """
        return self._axis("left", "right")

    @property
    def axis(self):
        """ Splattable list of :class:`~bokeh.models.axes.Axis` objects.

        """
        return _list_attr_splat(self.xaxis + self.yaxis)

    @property
    def legend(self):
        """Splattable list of :class:`~bokeh.models.annotations.Legend` objects.

        """
        legends = [obj for obj in self.renderers if isinstance(obj, Legend)]
        return _list_attr_splat(legends)

    def _grid(self, dimension):
        grid = [obj for obj in self.renderers if isinstance(obj, Grid) and obj.dimension==dimension]
        return _list_attr_splat(grid)

    @property
    def xgrid(self):
        """ Splattable list of :class:`~bokeh.models.grids.Grid` objects for the x dimension.

        """
        return self._grid(0)

    @property
    def ygrid(self):
        """ Splattable list of :class:`~bokeh.models.grids.Grid` objects for the y dimension.

        """
        return self._grid(1)

    @property
    def grid(self):
        """ Splattable list of :class:`~bokeh.models.grids.Grid` objects.

        """
        return _list_attr_splat(self.xgrid + self.ygrid)

    annular_wedge     = gf.annular_wedge
    annulus           = gf.annulus
    arc               = gf.arc
    asterisk          = gf.asterisk
    bezier            = gf.bezier
    circle            = gf.circle
    circle_cross      = gf.circle_cross
    circle_x          = gf.circle_x
    cross             = gf.cross
    diamond           = gf.diamond
    diamond_cross     = gf.diamond_cross
    image             = gf.image
    image_rgba        = gf.image_rgba
    image_url         = gf.image_url
    inverted_triangle = gf.inverted_triangle
    line              = gf.line
    multi_line        = gf.multi_line
    oval              = gf.oval
    patch             = gf.patch
    patches           = gf.patches
    quad              = gf.quad
    quadratic         = gf.quadratic
    ray               = gf.ray
    rect              = gf.rect
    segment           = gf.segment
    square            = gf.square
    square_cross      = gf.square_cross
    square_x          = gf.square_x
    text              = gf.text
    triangle          = gf.triangle
    wedge             = gf.wedge
    x                 = gf.x

    def scatter(self, *args, **kwargs):
        """ Creates a scatter plot of the given x and y items.

        Args:
            x (str or seq[float]) : values or field names of center x coordinates
            y (str or seq[float]) : values or field names of center y coordinates
            size (str or list[float]) : values or field names of sizes in screen units
            marker (str, optional): a valid marker_type, defaults to "circle"
            color (color value, optional): shorthand to set both fill and line color
            source (:class:`~bokeh.models.sources.ColumnDataSource`) : a user-supplied data source.
                If none is supplied, one is created for the user automatically.
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
    ''' Create a new :class:`~bokeh.plotting.Figure` for plotting, and add it to
    the current document.

    Returns:
       Figure

    '''
    if 'plot_width' in kwargs and 'width' in kwargs:
        raise ValueError("figure() called but both plot_width and width supplied, supply only one")
    if 'plot_height' in kwargs and 'height' in kwargs:
        raise ValueError("figure() called but both plot_height and height supplied, supply only one")
    if 'height' in kwargs:
        kwargs['plot_height'] = kwargs.pop('height')
    if 'width' in kwargs:
        kwargs['plot_width'] = kwargs.pop('width')

    fig = Figure(**kwargs)
    curdoc()._current_plot = fig
    if curdoc().autoadd:
        curdoc().add(fig)
    return fig


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
