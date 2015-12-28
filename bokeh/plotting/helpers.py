from __future__ import absolute_import

from collections import Iterable, OrderedDict, Sequence
import difflib
import itertools
import re
import warnings

import numpy as np
from six import string_types

from ..models import (
    BoxSelectTool, BoxZoomTool, CategoricalAxis,
    TapTool, CrosshairTool, DataRange1d, DatetimeAxis,
    FactorRange, Grid, HelpTool, HoverTool, LassoSelectTool, Legend, LinearAxis,
    LogAxis, PanTool, Plot, PolySelectTool,
    PreviewSaveTool, Range, Range1d, ResetTool, ResizeTool, Tool,
    WheelZoomTool, ColumnDataSource, GlyphRenderer)

from ..core.properties import ColorSpec, Datetime
from ..util.string import nice_join

DEFAULT_PALETTE = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]

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

def _pop_renderer_args(kwargs):
    result = dict(data_source=kwargs.pop('source', ColumnDataSource()))
    for attr in ['name', 'x_range_name', 'y_range_name', 'level']:
        val = kwargs.pop(attr, None)
        if val: result[attr] = val
    return result

def _pop_colors_and_alpha(glyphclass, kwargs, prefix="", default_alpha=1.0):
    """
    Given a kwargs dict, a prefix, and a default value, looks for different
    color and alpha fields of the given prefix, and fills in the default value
    if it doesn't exist.
    """
    result = dict()

    # TODO: The need to do this and the complexity of managing this kind of
    # thing throughout the codebase really suggests that we need to have
    # a real stylesheet class, where defaults and Types can declaratively
    # substitute for this kind of imperative logic.
    color = kwargs.pop(prefix+"color", get_default_color())
    for argname in ("fill_color", "line_color"):
        if argname not in glyphclass.properties(): continue
        result[argname] = kwargs.pop(prefix + argname, color)

    # NOTE: text fill color should really always default to black, hard coding
    # this here now until the stylesheet solution exists
    if "text_color" in glyphclass.properties():
        result["text_color"] = kwargs.pop(prefix + "text_color", "black")

    alpha = kwargs.pop(prefix+"alpha", default_alpha)
    for argname in ("fill_alpha", "line_alpha", "text_alpha"):
        if argname not in glyphclass.properties(): continue
        result[argname] = kwargs.pop(prefix + argname, alpha)

    return result

def _process_sequence_literals(glyphclass, kwargs, source):
    dataspecs = glyphclass.dataspecs_with_props()
    for var, val in kwargs.items():

        # ignore things that are not iterable
        if not isinstance(val, Iterable): continue

        # pass dicts (i.e., values or fields) on as-is
        if isinstance(val, dict): continue

        # let any non-dataspecs do their own validation (e.g., line_dash properties)
        if var not in dataspecs: continue

        # strings sequences are handled by the dataspec as-is
        if isinstance(val, string_types): continue

        # similarly colorspecs handle color tuple sequences as-is
        if (isinstance(dataspecs[var].descriptor, ColorSpec) and ColorSpec.is_color_tuple(val)):
            continue

        if isinstance(val, np.ndarray) and val.ndim != 1:
            raise RuntimeError("Columns need to be 1D (%s is not)" % var)

        source.add(val, name=var)
        kwargs[var] = var

def _make_glyph(glyphclass, kws, extra):
        if extra is None: return None
        kws = kws.copy()
        kws.update(extra)
        return glyphclass(**kws)

def _update_legend(plot, legend_name, glyph_renderer):
    legends = plot.select(type=Legend)
    if not legends:
        legend = Legend(plot=plot)
        # this awkward syntax is needed to go through Property.__set__ and
        # therefore trigger a change event. With improvements to Property
        # we might be able to use a more natural append() or +=
        plot.renderers = plot.renderers + [legend]
    elif len(legends) == 1:
        legend = legends[0]
    else:
        raise RuntimeError("Plot %s configured with more than one legend renderer" % plot)
    specs = OrderedDict(legend.legends)
    specs.setdefault(legend_name, []).append(glyph_renderer)
    legend.legends = list(specs.items())

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
    "tap": lambda: TapTool(),
    "crosshair": lambda: CrosshairTool(),
    "box_select": lambda: BoxSelectTool(),
    "xbox_select": lambda: BoxSelectTool(dimensions=['width']),
    "ybox_select": lambda: BoxSelectTool(dimensions=['height']),
    "poly_select": lambda: PolySelectTool(),
    "lasso_select": lambda: LassoSelectTool(),
    "box_zoom": lambda: BoxZoomTool(dimensions=['width', 'height']),
    "xbox_zoom": lambda: BoxZoomTool(dimensions=['width']),
    "ybox_zoom": lambda: BoxZoomTool(dimensions=['height']),
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

    fill_args = ["background_fill_color", "border_fill_color"]
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

class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)

    def __dir__(self):
        if len(set(type(x) for x in self)) == 1:
            return dir(self[0])
        else:
            return dir(self)

_arg_template = "    %s (%s) : %s (default %r)"
_doc_template = """ Configure and add %s glyphs to this Figure.

Args:
%s

Keyword Args:
%s

Other Parameters:
    alpha (float) : an alias to set all alpha keyword args at once
    color (Color) : an alias to set all color keyword args at once
    data_source (ColumnDataSource) : a user supplied data source
    legend (str) : a legend tag for this glyph
    x_range_name (str) : name an extra range to use for mapping x-coordinates
    y_range_name (str) : name an extra range to use for mapping y-coordinates
    level (Enum) : control the render level order for this glyph

It is also possible to set the color and alpha parameters of a "nonselection"
glyph. To do so, prefix any visual parameter with ``'nonselection_'``.
For example, pass ``nonselection_alpha`` or ``nonselection_fill_alpha``.

Returns:
    GlyphRenderer
"""

def _glyph_function(glyphclass, extra_docs=None):

    def func(self, *args, **kwargs):

        # pop off glyph *function* parameters that are not glyph class properties
        legend_name = kwargs.pop("legend", None)
        renderer_kws = _pop_renderer_args(kwargs)
        source = renderer_kws['data_source']

        # add the positional arguments as kwargs
        attributes = dict(zip(glyphclass._args, args))
        kwargs.update(attributes)

        # handle the main glyph, need to process literals
        glyph_ca = _pop_colors_and_alpha(glyphclass, kwargs)
        _process_sequence_literals(glyphclass, kwargs, source)
        _process_sequence_literals(glyphclass, glyph_ca, source)

        # handle the nonselection glyph, we always set one
        nsglyph_ca = _pop_colors_and_alpha(glyphclass, kwargs, prefix='nonselection_', default_alpha=0.1)

        # handle the selection glyph, if any properties were given
        if any(x.startswith('selection_') for x in kwargs):
            sglyph_ca = _pop_colors_and_alpha(glyphclass, kwargs, prefix='selection_')
        else:
            sglyph_ca = None

        # handle the hover glyph, if any properties were given
        if any(x.startswith('hover_') for x in kwargs):
            hglyph_ca = _pop_colors_and_alpha(glyphclass, kwargs, prefix='hover_')
        else:
            hglyph_ca = None

        glyph = _make_glyph(glyphclass, kwargs, glyph_ca)
        nsglyph = _make_glyph(glyphclass, kwargs, nsglyph_ca)
        hglyph = _make_glyph(glyphclass, kwargs, hglyph_ca)
        sglyph = _make_glyph(glyphclass, kwargs, sglyph_ca)

        glyph_renderer = GlyphRenderer(glyph=glyph,
                                       nonselection_glyph=nsglyph,
                                       selection_glyph=sglyph,
                                       hover_glyph=hglyph,
                                       **renderer_kws)

        if legend_name:
            _update_legend(self, legend_name, glyph_renderer)

        for tool in self.select(type=BoxSelectTool):
            # this awkward syntax is needed to go through Property.__set__ and
            # therefore trigger a change event. With improvements to Property
            # we might be able to use a more natural append() or +=
            tool.renderers = tool.renderers + [glyph_renderer]

        # awkward syntax for same reason mentioned above
        self.renderers = self.renderers + [glyph_renderer]
        return glyph_renderer

    func.__name__ = glyphclass.__view_model__

    arglines = []
    for arg in glyphclass._args:
        spec = getattr(glyphclass, arg)
        desc = " ".join(x.strip() for x in spec.__doc__.strip().split("\n\n")[0].split('\n'))
        arglines.append(_arg_template % (arg, spec.__class__.__name__, desc, spec.class_default(glyphclass)))

    kwlines = []
    kws = glyphclass.properties() - set(glyphclass._args)
    for kw in sorted(kws):
        if kw == "session": continue # TODO (bev) improve or remove
        spec = getattr(glyphclass, kw)
        if spec.__doc__:
            typ = spec.__class__.__name__
            desc = " ".join(x.strip() for x in spec.__doc__.strip().split("\n\n")[0].split('\n'))
        else:
            typ = str(spec)
            desc = ""
        kwlines.append(_arg_template % (kw, typ, desc, spec.class_default(glyphclass)))

    func.__doc__ = _doc_template  % (glyphclass.__name__, "\n".join(arglines), "\n".join(kwlines))

    if extra_docs:
        func.__doc__ += extra_docs
    return func
