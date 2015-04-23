from __future__ import absolute_import

from collections import Iterable, Sequence
import itertools
from numbers import Number
import numpy as np
import re
import difflib
from six import string_types

from .models import (
    BoxSelectTool, BoxZoomTool, CategoricalAxis,
    ColumnDataSource, RemoteSource, TapTool, CrosshairTool, DataRange1d, DatetimeAxis,
    FactorRange, Grid, HelpTool, HoverTool, LassoSelectTool, Legend, LinearAxis,
    LogAxis, PanTool, Plot, PolySelectTool,
    PreviewSaveTool, Range, Range1d, ResetTool, ResizeTool, Tool,
    WheelZoomTool)

from .properties import ColorSpec, Datetime
from .util.string import nice_join
import warnings

def get_default_color(plot=None):
    colors = [
      "#1f77b4",
      "#ff7f0e", "#ffbb78",
      "#2ca02c", "#98df8a",
      "#d62728", "#ff9896",
      "#9467bd", "#c5b0d5",
      "#8c564b", "#c49c94",
      "#e377c2", "#f7b6d2",
      "#7f7f7f",
      "#bcbd22", "#dbdb8d",
      "#17becf", "#9edae5"
    ]
    if plot:
        renderers = plot.renderers
        renderers = [x for x in renderers if x.__view_model__ == "GlyphRenderer"]
        num_renderers = len(renderers)
        return colors[num_renderers]
    else:
        return colors[0]

def get_default_alpha(plot=None):
    return 1.0

def _glyph_doc(args, props, desc):
    params_tuple =tuple(itertools.chain.from_iterable(sorted(list(args.items()))))
    params = "\t%s : %s\n" * len(args) % params_tuple

    return """%s

    Parameters
    ----------
    %s
    Additionally, the following properties are accepted as keyword arguments: %s

    Returns
    -------
    plot : :py:class:`Plot <bokeh.models.Plot>`
    """ % (desc, params, props)

def _match_data_params(argnames, glyphclass, datasource,
                       args, kwargs):
    """ Processes the arguments and kwargs passed in to __call__ to line
    them up with the argnames of the underlying Glyph

    Returns
    ---------
    glyph_params : dict of params that should be in the glyphspec
    """
    # Go through the list of position and keyword arguments, matching up
    # the full list of required glyph data attributes
    attributes = dict(zip(argnames, args))
    if len(args) < len(argnames):
        for argname in argnames[len(args):]:
            if argname in kwargs:
                attributes[argname] = kwargs.pop(argname)
            else:
                raise RuntimeError("Missing required glyph parameter '%s'" % argname)
    # Go through keys in alpha order, so that *_units are handled after
    # the dataspec dict is already created
    dataspecs = glyphclass.dataspecs_with_refs()
    for kw in kwargs:
        if (kw.endswith("_units") and kw[:-6] in dataspecs) or kw in dataspecs:
            attributes[kw] = kwargs[kw]

    glyph_params = {}
    for var in sorted(attributes.keys()):
        val = attributes[var]

        if var.endswith("_units") and var[:-6] in dataspecs:
            glyph_val = val
        elif isinstance(val, dict) or isinstance(val, Number):
            glyph_val = val
        elif isinstance(dataspecs.get(var, None), ColorSpec) and (ColorSpec.isconst(val) or val is None):
            # This check for color constants needs to happen relatively early on because
            # both strings and certain iterables are valid colors.
            glyph_val = val
        elif isinstance(val, string_types):
            if not isinstance(datasource, RemoteSource) and val not in datasource.column_names:
                raise RuntimeError("Column name '%s' does not appear in data source %r" % (val, datasource))
            else:
                if val not in datasource.column_names:
                    datasource.column_names.append(val)
                    datasource.data[val] = []
                glyph_val = {'field' : val}
        elif isinstance(val, np.ndarray):
            if val.ndim != 1:
                raise RuntimeError("Columns need to be 1D (%s is not)" % var)
            datasource.add(val, name=var)
            glyph_val = {'field' : var}
        elif isinstance(val, Iterable):
            datasource.add(val, name=var)
            glyph_val = {'field' : var}
        else:
            raise RuntimeError("Unexpected column type: %s" % type(val))
        glyph_params[var] = glyph_val
    return glyph_params

def _materialize_colors_and_alpha(kwargs, prefix="", default_alpha=1.0):
    """
    Given a kwargs dict, a prefix, and a default value, looks for different
    color and alpha fields of the given prefix, and fills in the default value
    if it doesn't exist.
    """
    kwargs = kwargs.copy()

    # TODO: The need to do this and the complexity of managing this kind of
    # thing throughout the codebase really suggests that we need to have
    # a real stylesheet class, where defaults and Types can declaratively
    # substitute for this kind of imperative logic.
    color = kwargs.pop(prefix+"color", get_default_color())
    for argname in ("fill_color", "line_color"):
        kwargs[argname] = kwargs.get(prefix + argname, color)

    # NOTE: text fill color should really always default to black, hard coding
    # this here now untils the stylesheet solution exists
    kwargs["text_color"] = kwargs.get(prefix + "text_color", "black")

    alpha = kwargs.pop(prefix+"alpha", default_alpha)
    for argname in ("fill_alpha", "line_alpha", "text_alpha"):
        kwargs[argname] = kwargs.get(prefix + argname, alpha)

    return kwargs

def _get_legend(plot):
    legend = [x for x in plot.renderers if x.__view_model__ == "Legend"]
    if len(legend) > 0:
        legend = legend[0]
    else:
        legend = None
    return legend

def _make_legend(plot):
    legend = Legend(plot=plot)
    plot.renderers.append(legend)
    plot._dirty = True
    return legend

def _get_select_tool(plot):
    """returns select tool on a plot, if it's there
    """
    select_tool = [x for x in plot.tools if x.__view_model__ == "BoxSelectTool"]
    if len(select_tool) > 0:
        select_tool = select_tool[0]
    else:
        select_tool = None
    return select_tool

def _get_range(range_input):
    if range_input is None:
        return DataRange1d()
    if isinstance(range_input, Range):
        return range_input
    if isinstance(range_input, Sequence):
        if all(isinstance(x, string_types) for x in range_input):
            return FactorRange(factors=range_input)
        if len(range_input) == 2:
            try:
                return Range1d(start=range_input[0], end=range_input[1])
            except ValueError: # @mattpap suggests ValidationError instead
                pass
    raise ValueError("Unrecognized range input: '%s'" % str(range_input))

def _get_axis_class(axis_type, range_input):
    if axis_type is None:
        return None
    elif axis_type == "linear":
        return LinearAxis
    elif axis_type == "log":
        return LogAxis
    elif axis_type == "datetime":
        return DatetimeAxis
    elif axis_type == "auto":
        if isinstance(range_input, FactorRange):
            return CategoricalAxis
        elif isinstance(range_input, Range1d):
            try:
                # Easier way to validate type of Range1d parameters
                Datetime.validate(Datetime(), range_input.start)
                return DatetimeAxis
            except ValueError:
                pass
        return LinearAxis
    else:
        raise ValueError("Unrecognized axis_type: '%r'" % axis_type)


def _get_num_minor_ticks(axis_class, num_minor_ticks):
    if isinstance(num_minor_ticks, int):
        if num_minor_ticks <= 1:
            raise ValueError("num_minor_ticks must be > 1")
        return num_minor_ticks
    if num_minor_ticks is None:
        return 0
    if num_minor_ticks == 'auto':
        if axis_class is LogAxis:
            return 10
        return 5

_known_tools = {
    "pan": lambda: PanTool(dimensions=["width", "height"]),
    "xpan": lambda: PanTool(dimensions=["width"]),
    "ypan": lambda: PanTool(dimensions=["height"]),
    "wheel_zoom": lambda: WheelZoomTool(dimensions=["width", "height"]),
    "xwheel_zoom": lambda: WheelZoomTool(dimensions=["width"]),
    "ywheel_zoom": lambda: WheelZoomTool(dimensions=["height"]),
    "save": lambda: PreviewSaveTool(),
    "resize": lambda: ResizeTool(),
    "click": "tap",
    "tap": lambda: TapTool(always_active=True),
    "crosshair": lambda: CrosshairTool(),
    "box_select": lambda: BoxSelectTool(),
    "poly_select": lambda: PolySelectTool(),
    "lasso_select": lambda: LassoSelectTool(),
    "box_zoom": lambda: BoxZoomTool(),
    "hover": lambda: HoverTool(always_active=True, tooltips=[
        ("index", "$index"),
        ("data (x, y)", "($x, $y)"),
        ("canvas (x, y)", "($sx, $sy)"),
    ]),
    "previewsave": lambda: PreviewSaveTool(),
    "reset": lambda: ResetTool(),
    "help": lambda: HelpTool(),
}

def _tool_from_string(name):
    """ Takes a string and returns a corresponding `Tool` instance. """
    known_tools = sorted(_known_tools.keys())

    if name in known_tools:
        tool_fn = _known_tools[name]

        if isinstance(tool_fn, string_types):
            tool_fn = _known_tools[tool_fn]

        return tool_fn()
    else:
        matches, text = difflib.get_close_matches(name.lower(), known_tools), "similar"

        if not matches:
            matches, text = known_tools, "possible"

        raise ValueError("unexpected tool name '%s', %s tools are %s" % (name, text, nice_join(matches)))


def _process_tools_arg(plot, tools):
    """ Adds tools to the plot object

    Args:
        plot (Plot): instance of a plot object
        tools (seq[Tool or str]|str): list of tool types or string listing the
            tool names. Those are converted using the _tool_from_string
            function. I.e.: `wheel_zoom,box_zoom,reset`.

    Returns:
        list of Tools objects added to plot
    """
    tool_objs = []
    temp_tool_str = ""
    repeated_tools = []

    if isinstance(tools, (list, tuple)):
        for tool in tools:
            if isinstance(tool, Tool):
                tool_objs.append(tool)
            elif isinstance(tool, string_types):
                temp_tool_str += tool + ','
            else:
                raise ValueError("tool should be a string or an instance of Tool class")
        tools = temp_tool_str

    for tool in re.split(r"\s*,\s*", tools.strip()):
        # re.split will return empty strings; ignore them.
        if tool == "":
            continue

        tool_obj = _tool_from_string(tool)
        tool_objs.append(tool_obj)

    for typename, group in itertools.groupby(
            sorted([tool.__class__.__name__ for tool in tool_objs])):
        if len(list(group)) > 1:
            repeated_tools.append(typename)

    if repeated_tools:
        warnings.warn("%s are being repeated" % ",".join(repeated_tools))

    return tool_objs


def _new_xy_plot(x_range=None, y_range=None, plot_width=None, plot_height=None,
                 x_axis_type="auto", y_axis_type="auto",
                 x_axis_location="below", y_axis_location="left",
                 x_minor_ticks='auto', y_minor_ticks='auto',
                 tools="pan,wheel_zoom,box_zoom,save,resize,reset", **kw):
    # Accept **kw to absorb other arguments which the actual factory functions
    # might pass in, but that we don't care about

    plot = Plot()
    plot.title = kw.pop("title", "Plot")

    plot.toolbar_location = kw.pop("toolbar_location", "above")

    plot.x_range = _get_range(x_range)
    plot.y_range = _get_range(y_range)

    if plot_width: plot.plot_width = plot_width
    if plot_height: plot.plot_height = plot_height

    x_axiscls = _get_axis_class(x_axis_type, plot.x_range)
    if x_axiscls:
        if x_axiscls is LogAxis:
            plot.x_mapper_type = 'log'
        xaxis = x_axiscls(plot=plot)
        xaxis.ticker.num_minor_ticks = _get_num_minor_ticks(x_axiscls, x_minor_ticks)
        axis_label = kw.pop('x_axis_label', None)
        if axis_label:
            xaxis.axis_label = axis_label
        xgrid = Grid(plot=plot, dimension=0, ticker=xaxis.ticker); xgrid
        if x_axis_location == "above":
            plot.above.append(xaxis)
        elif x_axis_location == "below":
            plot.below.append(xaxis)

    y_axiscls = _get_axis_class(y_axis_type, plot.y_range)
    if y_axiscls:
        if y_axiscls is LogAxis:
            plot.y_mapper_type = 'log'
        yaxis = y_axiscls(plot=plot)
        yaxis.ticker.num_minor_ticks = _get_num_minor_ticks(y_axiscls, y_minor_ticks)
        axis_label = kw.pop('y_axis_label', None)
        if axis_label:
            yaxis.axis_label = axis_label
        ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker); ygrid
        if y_axis_location == "left":
            plot.left.append(yaxis)
        elif y_axis_location == "right":
            plot.right.append(yaxis)

    border_args = ["min_border", "min_border_top", "min_border_bottom", "min_border_left", "min_border_right"]
    for arg in border_args:
        if arg in kw:
            setattr(plot, arg, kw.pop(arg))

    fill_args = ["background_fill", "border_fill"]
    for arg in fill_args:
        if arg in kw:
            setattr(plot, arg, kw.pop(arg))

    style_arg_prefix = ["title", "outline"]
    for prefix in style_arg_prefix:
        for k in list(kw):
            if k.startswith(prefix):
                setattr(plot, k, kw.pop(k))

    if 'toolbar_location' in list(kw):
        plot.toolbar_location = kw.pop('toolbar_location')

    tool_objs = []
    temp_tool_str = str()

    if isinstance(tools, list):
        for tool in tools:
            if isinstance(tool, Tool):
                tool_objs.append(tool)
            elif isinstance(tool, string_types):
                temp_tool_str+=tool + ','
            else:
                raise ValueError("tool should be a string or an instance of Tool class")
        tools = temp_tool_str

    repeated_tools = []

    for tool in re.split(r"\s*,\s*", tools.strip()):
        # re.split will return empty strings; ignore them.
        if tool == "":
            continue

        tool_obj = _tool_from_string(tool)
        tool_obj.plot = plot

        tool_objs.append(tool_obj)

    plot.tools.extend(tool_objs)

    for typename, group in itertools.groupby(sorted([ tool.__class__.__name__ for tool in plot.tools ])):
        if len(list(group)) > 1:
            repeated_tools.append(typename)

    if repeated_tools:
        warnings.warn("%s are being repeated" % ",".join(repeated_tools))

    return plot


def _handle_1d_data_args(args, datasource=None, create_autoindex=True):
    """ Returns a datasource and a list of names corresponding (roughly)
    to the input data.  If only a single array was given, and an index
    array was created, then the index's name is returned first.
    """
    arrays = []
    if datasource is None:
        datasource = ColumnDataSource()
    # First process all the arguments to homogenize shape.  After this
    # process, "arrays" should contain a uniform list of string/ndarray/iterable
    # corresponding to the inputs.
    for arg in args:
        if isinstance(arg, string_types):
            # This has to be handled before our check for Iterable
            arrays.append(arg)

        elif isinstance(arg, np.ndarray):
            if arg.ndim == 1:
                arrays.append(arg)
            else:
                arrays.extend(arg)

        elif isinstance(arg, Iterable):
            arrays.append(arg)

        elif isinstance(arg, Number):
            arrays.append([arg])

    # Now handle the case when they've only provided a single array of
    # inputs (i.e. just the values, and no x positions).  Generate a new
    # dummy array for this.
    if create_autoindex and len(arrays) == 1:
        arrays.insert(0, np.arange(len(arrays[0])))

    # Now put all the data into a DataSource, or insert into existing one
    names = []
    for i, ary in enumerate(arrays):
        if isinstance(ary, string_types):
            name = ary
        else:
            if i == 0 and create_autoindex:
                name = datasource.add(ary, name="_autoindex")
            else:
                name = datasource.add(ary)
        names.append(name)
    return names, datasource

class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)
