from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

import itertools

from . import _glyph_functions as gf
from .deprecate import deprecated
from .models import Axis, Grid, GridPlot, Legend, LogAxis, Plot
from .plotting_helpers import (
    get_default_color, get_default_alpha, _handle_1d_data_args, _list_attr_splat,
    _get_range, _get_axis_class, _get_num_minor_ticks, _process_tools_arg
)

# extra imports -- just things to add to 'from plotting import *'
from .document import Document
from .models import ColumnDataSource
from .session import Session
from .io import (
    curdoc, cursession, output_file, output_notebook, output_server, push,
    reset_output, save, show, gridplot, hplot, vplot)

@deprecated("Bokeh 0.8.2", "bokeh.plotting.vplot function")
def VBox(*args, **kwargs):
    ''' Generate a layout that arranges several subplots vertically.
    '''

    return vplot(*args, **kwargs)

@deprecated("Bokeh 0.8.2", "bokeh.plotting.hplot function")
def HBox(*args, **kwargs):
    ''' Generate a layout that arranges several subplots horizontally.
    '''

    return hplot(*args, **kwargs)


DEFAULT_TOOLS = "pan,wheel_zoom,box_zoom,save,resize,reset"

class Figure(Plot):
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
            xgrid = Grid(plot=self, dimension=0, ticker=xaxis.ticker)
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
            ygrid = Grid(plot=self, dimension=1, ticker=yaxis.ticker)
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
        """ Get the current `x` axis object(s)

        Returns:
            splattable list of x-axis objects on this Plot
        """
        return self._axis("above", "below")

    @property
    def yaxis(self):
        """ Get the current `y` axis object(s)

        Returns:
            splattable list of y-axis objects on this Plot
        """
        return self._axis("left", "right")

    @property
    def axis(self):
        """ Get all the current axis objects

        Returns:
            splattable list of axis objects on this Plot
        """
        return _list_attr_splat(self.xaxis + self.yaxis)

    @property
    def legend(self):
        """ Get the current :class:`legend <bokeh.models.Legend>` object(s)

        Returns:
            splattable list of legend objects on this Plot
        """
        legends = [obj for obj in self.renderers if isinstance(obj, Legend)]
        return _list_attr_splat(legends)

    def _grid(self, dimension):
        grid = [obj for obj in self.renderers if isinstance(obj, Grid) and obj.dimension==dimension]
        return _list_attr_splat(grid)

    @property
    def xgrid(self):
        """ Get the current `x` :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of legend objects on this Plot
        """
        return self._grid(0)

    @property
    def ygrid(self):
        """ Get the current `y` :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of y-grid objects on this Plot
        """
        return self._grid(1)

    @property
    def grid(self):
        """ Get the current :class:`grid <bokeh.models.Grid>` object(s)

        Returns:
            splattable list of grid objects on this Plot
        """
        return _list_attr_splat(self.xgrid + self.ygrid)

    annular_wedge     = gf.annular_wedge
    annulus           = gf.annulus
    arc               = gf.arc
    asterisk          = gf.asterisk
    bezier            = gf.bezier
    circle            = gf.circle
    circle_cross      = gf.circle_cross
    circle_x          = gf. circle_x
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
            *args : The data to plot.  Can be of several forms:

                (X, Y)
                    Two 1D arrays or iterables
                (XNAME, YNAME)
                    Two bokeh DataSource/ColumnsRef

            marker (str, optional): a valid marker_type, defaults to "circle"
            color (color value, optional): shorthand to set both fill and line color

        All the :ref:`userguide_objects_line_properties` and :ref:`userguide_objects_fill_properties` are
        also accepted as keyword parameters.

        Examples:

            >>> p.scatter([1,2,3],[4,5,6], fill_color="red")
            >>> p.scatter("data1", "data2", source=data_source, ...)

        """
        ds = kwargs.get("source", None)
        names, datasource = _handle_1d_data_args(args, datasource=ds)
        kwargs["source"] = datasource

        markertype = kwargs.get("marker", "circle")

        if not len(_color_fields.intersection(set(kwargs.keys()))):
            kwargs['color'] = get_default_color()
        if not len(_alpha_fields.intersection(set(kwargs.keys()))):
            kwargs['alpha'] = get_default_alpha()

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
    ''' Activate a new figure for plotting.

    All subsequent plotting operations will affect the new figure.

    This function accepts all plot style keyword parameters.

    Returns:
       figure : a new :class:`Plot <bokeh.models.plots.Plot>`

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
