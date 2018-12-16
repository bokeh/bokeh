from __future__ import absolute_import

from collections import Iterable, OrderedDict, Sequence
import difflib
import itertools
import re
import textwrap
import warnings

import numpy as np
import sys
from six import string_types, reraise

from ..models import (
    BoxSelectTool, BoxZoomTool, CategoricalAxis, MercatorAxis,
    TapTool, CrosshairTool, DataRange1d, DatetimeAxis,
    FactorRange, Grid, HelpTool, HoverTool, LassoSelectTool, Legend, LegendItem, LinearAxis,
    LogAxis, PanTool, ZoomInTool, ZoomOutTool, PolySelectTool, ContinuousTicker,
    SaveTool, Range, Range1d, UndoTool, RedoTool, ResetTool, Tool,
    WheelPanTool, WheelZoomTool, ColumnarDataSource, ColumnDataSource,
    LogScale, LinearScale, CategoricalScale, Circle, MultiLine,
    BoxEditTool, PointDrawTool, PolyDrawTool, PolyEditTool)
from bokeh.models.markers import Marker
from ..models.renderers import GlyphRenderer

from ..core.properties import ColorSpec, Datetime, value, field
from ..transform import stack
from ..util.dependencies import import_optional
from ..util.string import nice_join

pd = import_optional('pandas')


def _stack(stackers, spec0, spec1, **kw):
    for name in (spec0, spec1):
        if name in kw:
            raise ValueError("Stack property '%s' cannot appear in keyword args" % name)

    lengths = { len(x) for x in kw.values() if isinstance(x, (list, tuple)) }

    # lengths will be empty if there are no kwargs supplied at all
    if len(lengths) > 0:
        if len(lengths) != 1:
            raise ValueError("Keyword argument sequences for broadcasting must all be the same lengths. Got lengths: %r" % sorted(list(lengths)))
        if lengths.pop() != len(stackers):
            raise ValueError("Keyword argument sequences for broadcasting must be the same length as stackers")

    s0 = []
    s1 = []

    _kw = []

    for i, val in enumerate(stackers):
        d  = {'name': val}
        s0 = list(s1)
        s1.append(val)

        d[spec0] = stack(*s0)
        d[spec1] = stack(*s1)

        for k, v in kw.items():
            if isinstance(v, (list, tuple)):
                d[k] = v[i]
            else:
                d[k] = v

        _kw.append(d)

    return _kw

def _graph(node_source, edge_source, **kwargs):

    if not isinstance(node_source, ColumnarDataSource):
        try:
            # try converting the soruce to ColumnDataSource
            node_source = ColumnDataSource(node_source)
        except ValueError as err:
            msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                curr_type=str(type(node_source)),
                err=err.message
            )
            reraise(ValueError, ValueError(msg), sys.exc_info()[2])

    if not isinstance(edge_source, ColumnarDataSource):
        try:
            # try converting the soruce to ColumnDataSource
            edge_source = ColumnDataSource(edge_source)
        except ValueError as err:
            msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                curr_type=str(type(edge_source)),
                err=err.message
            )
            reraise(ValueError, ValueError(msg), sys.exc_info()[2])

    ## node stuff
    if any(x.startswith('node_selection_') for x in kwargs):
        snode_ca = _pop_colors_and_alpha(Circle, kwargs, prefix="node_selection_")
    else:
        snode_ca = None

    if any(x.startswith('node_hover_') for x in kwargs):
        hnode_ca = _pop_colors_and_alpha(Circle, kwargs, prefix="node_hover_")
    else:
        hnode_ca = None

    if any(x.startswith('node_muted_') for x in kwargs):
        mnode_ca = _pop_colors_and_alpha(Circle, kwargs, prefix="node_muted_")
    else:
        mnode_ca = None

    nsnode_ca = _pop_colors_and_alpha(Circle, kwargs, prefix="node_nonselection_")
    node_ca = _pop_colors_and_alpha(Circle, kwargs, prefix="node_")

    ## edge stuff
    if any(x.startswith('edge_selection_') for x in kwargs):
        sedge_ca = _pop_colors_and_alpha(MultiLine, kwargs, prefix="edge_selection_")
    else:
        sedge_ca = None

    if any(x.startswith('edge_hover_') for x in kwargs):
        hedge_ca = _pop_colors_and_alpha(MultiLine, kwargs, prefix="edge_hover_")
    else:
        hedge_ca = None

    if any(x.startswith('edge_muted_') for x in kwargs):
        medge_ca = _pop_colors_and_alpha(MultiLine, kwargs, prefix="edge_muted_")
    else:
        medge_ca = None

    nsedge_ca = _pop_colors_and_alpha(MultiLine, kwargs, prefix="edge_nonselection_")
    edge_ca = _pop_colors_and_alpha(MultiLine, kwargs, prefix="edge_")

    ## node stuff
    node_kwargs = {k.lstrip('node_'): v for k, v in kwargs.copy().items() if k.lstrip('node_') in Circle.properties()}

    node_glyph = _make_glyph(Circle, node_kwargs, node_ca)
    nsnode_glyph = _make_glyph(Circle, node_kwargs, nsnode_ca)
    snode_glyph = _make_glyph(Circle, node_kwargs, snode_ca)
    hnode_glyph = _make_glyph(Circle, node_kwargs, hnode_ca)
    mnode_glyph = _make_glyph(Circle, node_kwargs, mnode_ca)

    node_renderer = GlyphRenderer(glyph=node_glyph,
                                  nonselection_glyph=nsnode_glyph,
                                  selection_glyph=snode_glyph,
                                  hover_glyph=hnode_glyph,
                                  muted_glyph=mnode_glyph,
                                  data_source=node_source)

    ## edge stuff
    edge_kwargs = {k.lstrip('edge_'): v for k, v in kwargs.copy().items() if k.lstrip('edge_') in MultiLine.properties()}

    edge_glyph = _make_glyph(MultiLine, edge_kwargs, edge_ca)
    nsedge_glyph = _make_glyph(MultiLine, edge_kwargs, nsedge_ca)
    sedge_glyph = _make_glyph(MultiLine, edge_kwargs, sedge_ca)
    hedge_glyph = _make_glyph(MultiLine, edge_kwargs, hedge_ca)
    medge_glyph = _make_glyph(MultiLine, edge_kwargs, medge_ca)

    edge_renderer = GlyphRenderer(glyph=edge_glyph,
                                  nonselection_glyph=nsedge_glyph,
                                  selection_glyph=sedge_glyph,
                                  hover_glyph=hedge_glyph,
                                  muted_glyph=medge_glyph,
                                  data_source=edge_source)

    _RENDERER_ARGS = ['name', 'level', 'visible', 'x_range_name', 'y_range_name',
                      'selection_policy', 'inspection_policy']

    renderer_kwargs = {attr: kwargs.pop(attr) for attr in _RENDERER_ARGS if attr in kwargs}

    renderer_kwargs["node_renderer"] = node_renderer
    renderer_kwargs["edge_renderer"] = edge_renderer

    return renderer_kwargs

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


_RENDERER_ARGS = ['name', 'x_range_name', 'y_range_name',
                  'level', 'view', 'visible', 'muted']


def _pop_renderer_args(kwargs):
    result = {attr: kwargs.pop(attr)
              for attr in _RENDERER_ARGS
              if attr in kwargs}
    result['data_source'] = kwargs.pop('source', ColumnDataSource())
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
    color = kwargs.pop(prefix + "color", get_default_color())
    for argname in ("fill_color", "line_color"):
        if argname not in glyphclass.properties():
            continue
        result[argname] = kwargs.pop(prefix + argname, color)

    # NOTE: text fill color should really always default to black, hard coding
    # this here now until the stylesheet solution exists
    if "text_color" in glyphclass.properties():
        result["text_color"] = kwargs.pop(prefix + "text_color", "black")

    alpha = kwargs.pop(prefix + "alpha", default_alpha)
    for argname in ("fill_alpha", "line_alpha", "text_alpha"):
        if argname not in glyphclass.properties():
            continue
        result[argname] = kwargs.pop(prefix + argname, alpha)

    return result


def _get_legend_item_label(kwargs):
    legend = kwargs.pop('legend', None)
    source = kwargs.get('source')
    legend_item_label = None
    if legend:
        if isinstance(legend, string_types):
            # Do the simple thing first
            legend_item_label = value(legend)
            # But if there's a source - try and do something smart
            if source is not None and hasattr(source, 'column_names'):
                if legend in source.column_names:
                    legend_item_label = field(legend)
        else:
            legend_item_label = legend
    return legend_item_label


_GLYPH_SOURCE_MSG = """

Expected %s to reference fields in the supplied data source.

When a 'source' argument is passed to a glyph method, values that are sequences
(like lists or arrays) must come from references to data columns in the source.

For instance, as an example:

    source = ColumnDataSource(data=dict(x=a_list, y=an_array))

    p.circle(x='x', y='y', source=source, ...) # pass column names and a source

Alternatively, *all* data sequences may be provided as literals as long as a
source is *not* provided:

    p.circle(x=a_list, y=an_array, ...)  # pass actual sequences and no source

"""


def _process_sequence_literals(glyphclass, kwargs, source, is_user_source):
    incompatible_literal_spec_values = []
    dataspecs = glyphclass.dataspecs_with_props()
    for var, val in kwargs.items():

        # ignore things that are not iterable
        if not isinstance(val, Iterable):
            continue

        # pass dicts (i.e., values or fields) on as-is
        if isinstance(val, dict):
            continue

        # let any non-dataspecs do their own validation (e.g., line_dash properties)
        if var not in dataspecs:
            continue

        # strings sequences are handled by the dataspec as-is
        if isinstance(val, string_types):
            continue

        # similarly colorspecs handle color tuple sequences as-is
        if (isinstance(dataspecs[var].property, ColorSpec) and isinstance(val, tuple)):
            continue

        if isinstance(val, np.ndarray) and val.ndim != 1:
            raise RuntimeError("Columns need to be 1D (%s is not)" % var)

        if is_user_source:
            incompatible_literal_spec_values.append(var)
        else:
            source.add(val, name=var)
            kwargs[var] = var

    return incompatible_literal_spec_values


def _make_glyph(glyphclass, kws, extra):
    if extra is None:
        return None
    kws = kws.copy()
    kws.update(extra)
    return glyphclass(**kws)


def _update_legend(plot, legend_item_label, glyph_renderer):
    # Get the plot's legend
    legends = plot.select(type=Legend)
    if not legends:
        legend = Legend()
        plot.add_layout(legend)
    elif len(legends) == 1:
        legend = legends[0]
    else:
        raise RuntimeError("Plot %s configured with more than one legend renderer" % plot)

    # If there is an existing legend with a matching label, then put the
    # renderer on that (if the source matches). Otherwise add a new one.
    added = False
    for item in legend.items:
        if item.label == legend_item_label:
            if item.label.get('value'):
                item.renderers.append(glyph_renderer)
                added = True
                break
            if item.label.get('field') and \
                    glyph_renderer.data_source is item.renderers[0].data_source:
                item.renderers.append(glyph_renderer)
                added = True
                break
    if not added:
        new_item = LegendItem(label=legend_item_label, renderers=[glyph_renderer])
        legend.items.append(new_item)


def _get_range(range_input):
    if range_input is None:
        return DataRange1d()
    if pd and isinstance(range_input, pd.core.groupby.GroupBy):
        return FactorRange(factors=sorted(list(range_input.groups.keys())))
    if isinstance(range_input, Range):
        return range_input
    if pd and isinstance(range_input, pd.Series):
        range_input = range_input.values
    if isinstance(range_input, (Sequence, np.ndarray)):
        if all(isinstance(x, string_types) for x in range_input):
            return FactorRange(factors=list(range_input))
        if len(range_input) == 2:
            try:
                return Range1d(start=range_input[0], end=range_input[1])
            except ValueError:  # @mattpap suggests ValidationError instead
                pass
    raise ValueError("Unrecognized range input: '%s'" % str(range_input))


def _get_scale(range_input, axis_type):
    if isinstance(range_input, (DataRange1d, Range1d)) and axis_type in ["linear", "datetime", "mercator", "auto", None]:
        return LinearScale()
    elif isinstance(range_input, (DataRange1d, Range1d)) and axis_type == "log":
        return LogScale()
    elif isinstance(range_input, FactorRange):
        return CategoricalScale()
    else:
        raise ValueError("Unable to determine proper scale for: '%s'" % str(range_input))


def _get_axis_class(axis_type, range_input, dim):
    if axis_type is None:
        return None, {}
    elif axis_type == "linear":
        return LinearAxis, {}
    elif axis_type == "log":
        return LogAxis, {}
    elif axis_type == "datetime":
        return DatetimeAxis, {}
    elif axis_type == "mercator":
        return MercatorAxis, {'dimension': 'lon' if dim == 0 else 'lat'}
    elif axis_type == "auto":
        if isinstance(range_input, FactorRange):
            return CategoricalAxis, {}
        elif isinstance(range_input, Range1d):
            try:
                # Easier way to validate type of Range1d parameters
                Datetime.validate(Datetime(), range_input.start)
                return DatetimeAxis, {}
            except ValueError:
                pass
        return LinearAxis, {}
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
    "pan": lambda: PanTool(dimensions='both'),
    "xpan": lambda: PanTool(dimensions='width'),
    "ypan": lambda: PanTool(dimensions='height'),
    "xwheel_pan": lambda: WheelPanTool(dimension="width"),
    "ywheel_pan": lambda: WheelPanTool(dimension="height"),
    "wheel_zoom": lambda: WheelZoomTool(dimensions='both'),
    "xwheel_zoom": lambda: WheelZoomTool(dimensions='width'),
    "ywheel_zoom": lambda: WheelZoomTool(dimensions='height'),
    "zoom_in": lambda: ZoomInTool(dimensions='both'),
    "xzoom_in": lambda: ZoomInTool(dimensions='width'),
    "yzoom_in": lambda: ZoomInTool(dimensions='height'),
    "zoom_out": lambda: ZoomOutTool(dimensions='both'),
    "xzoom_out": lambda: ZoomOutTool(dimensions='width'),
    "yzoom_out": lambda: ZoomOutTool(dimensions='height'),
    "click": lambda: TapTool(behavior="inspect"),
    "tap": lambda: TapTool(),
    "crosshair": lambda: CrosshairTool(),
    "box_select": lambda: BoxSelectTool(),
    "xbox_select": lambda: BoxSelectTool(dimensions='width'),
    "ybox_select": lambda: BoxSelectTool(dimensions='height'),
    "poly_select": lambda: PolySelectTool(),
    "lasso_select": lambda: LassoSelectTool(),
    "box_zoom": lambda: BoxZoomTool(dimensions='both'),
    "xbox_zoom": lambda: BoxZoomTool(dimensions='width'),
    "ybox_zoom": lambda: BoxZoomTool(dimensions='height'),
    "hover": lambda: HoverTool(tooltips=[
        ("index", "$index"),
        ("data (x, y)", "($x, $y)"),
        ("screen (x, y)", "($sx, $sy)"),
    ]),
    "save": lambda: SaveTool(),
    "previewsave": "save",
    "undo": lambda: UndoTool(),
    "redo": lambda: RedoTool(),
    "reset": lambda: ResetTool(),
    "help": lambda: HelpTool(),
    "box_edit": lambda: BoxEditTool(),
    "point_draw": lambda: PointDrawTool(),
    "poly_draw": lambda: PolyDrawTool(),
    "poly_edit": lambda: PolyEditTool()
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


def _process_axis_and_grid(plot, axis_type, axis_location, minor_ticks, axis_label, rng, dim):
    axiscls, axiskw = _get_axis_class(axis_type, rng, dim)
    if axiscls:

        # this is so we can get a ticker off the axis, even if we discard it
        axis = axiscls(plot=plot if axis_location else None, **axiskw)

        if isinstance(axis.ticker, ContinuousTicker):
            axis.ticker.num_minor_ticks = _get_num_minor_ticks(axiscls, minor_ticks)

        axis_label = axis_label
        if axis_label:
            axis.axis_label = axis_label

        grid = Grid(plot=plot, dimension=dim, ticker=axis.ticker); grid

        if axis_location is not None:
            getattr(plot, axis_location).append(axis)


def _process_tools_arg(plot, tools, tooltips=None):
    """ Adds tools to the plot object

    Args:
        plot (Plot): instance of a plot object
        tools (seq[Tool or str]|str): list of tool types or string listing the
            tool names. Those are converted using the _tool_from_string
            function. I.e.: `wheel_zoom,box_zoom,reset`.
        tooltips (string or seq[tuple[str, str]], optional):
            tooltips to use to configure a HoverTool

    Returns:
        list of Tools objects added to plot, map of supplied string names to tools
    """
    tool_objs = []
    tool_map = {}
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
        tool_map[tool] = tool_obj

    for typename, group in itertools.groupby(
            sorted(tool.__class__.__name__ for tool in tool_objs)):
        if len(list(group)) > 1:
            repeated_tools.append(typename)

    if repeated_tools:
        warnings.warn("%s are being repeated" % ",".join(repeated_tools))

    if tooltips is not None:
        for tool_obj in tool_objs:
            if isinstance(tool_obj, HoverTool):
                tool_obj.tooltips = tooltips
                break
        else:
            tool_objs.append(HoverTool(tooltips=tooltips))

    return tool_objs, tool_map


def _process_active_tools(toolbar, tool_map, active_drag, active_inspect, active_scroll, active_tap):
    """ Adds tools to the plot object

    Args:
        toolbar (Toolbar): instance of a Toolbar object
        tools_map (dict[str]|Tool): tool_map from _process_tools_arg
        active_drag (str or Tool): the tool to set active for drag
        active_inspect (str or Tool): the tool to set active for inspect
        active_scroll (str or Tool): the tool to set active for scroll
        active_tap (str or Tool): the tool to set active for tap

    Returns:
        None

    Note:
        This function sets properties on Toolbar
    """
    if active_drag in ['auto', None] or isinstance(active_drag, Tool):
        toolbar.active_drag = active_drag
    elif active_drag in tool_map:
        toolbar.active_drag = tool_map[active_drag]
    else:
        raise ValueError("Got unknown %r for 'active_drag', which was not a string supplied in 'tools' argument" % active_drag)

    if active_inspect in ['auto', None] or isinstance(active_inspect, Tool) or all(isinstance(t, Tool) for t in active_inspect):
        toolbar.active_inspect = active_inspect
    elif active_inspect in tool_map:
        toolbar.active_inspect = tool_map[active_inspect]
    else:
        raise ValueError("Got unknown %r for 'active_inspect', which was not a string supplied in 'tools' argument" % active_scroll)

    if active_scroll in ['auto', None] or isinstance(active_scroll, Tool):
        toolbar.active_scroll = active_scroll
    elif active_scroll in tool_map:
        toolbar.active_scroll = tool_map[active_scroll]
    else:
        raise ValueError("Got unknown %r for 'active_scroll', which was not a string supplied in 'tools' argument" % active_scroll)

    if active_tap in ['auto', None] or isinstance(active_tap, Tool):
        toolbar.active_tap = active_tap
    elif active_tap in tool_map:
        toolbar.active_tap = tool_map[active_tap]
    else:
        raise ValueError("Got unknown %r for 'active_tap', which was not a string supplied in 'tools' argument" % active_tap)

def _get_argspecs(glyphclass):
    argspecs = OrderedDict()
    for arg in glyphclass._args:
        spec = {}
        descriptor = getattr(glyphclass, arg)

        # running python with -OO will discard docstrings -> __doc__ is None
        if descriptor.__doc__:
            spec['desc'] = "\n        ".join(textwrap.dedent(descriptor.__doc__).split("\n"))
        else:
            spec['desc'] = ""
        spec['default'] = descriptor.class_default(glyphclass)
        spec['type'] = descriptor.property._sphinx_type()
        argspecs[arg] = spec
    return argspecs

# This template generates the following:
#
# def foo(self, x, y=10, kwargs):
#     kwargs['x'] = x
#     kwargs['y'] = y
#     return func(self, **kwargs)
_sigfunc_template = """
def %s(self, %s, **kwargs):
%s
    return func(self, **kwargs)
"""

def _get_sigfunc(func_name, func, argspecs):
    # This code is to wrap the generic func(*args, **kw) glyph method so that
    # a much better signature is available to users. E.g., for ``square`` we have:
    #
    # Signature: p.square(x, y, size=4, angle=0.0, **kwargs)
    #
    # which provides descriptive names for positional args, as well as any defaults
    func_args_with_defaults = []
    for arg, spec in argspecs.items():
        if spec['default'] is None:
            func_args_with_defaults.append(arg)
        else:
            func_args_with_defaults.append("%s=%r" % (arg, spec['default']))
    args_text = ", ".join(func_args_with_defaults)
    kwargs_assign_text = "\n".join("    kwargs[%r] = %s" % (x, x) for x in argspecs)
    func_text = _sigfunc_template % (func_name, args_text, kwargs_assign_text)
    func_code = compile(func_text, "fakesource", "exec")
    func_globals = {}
    eval(func_code, {"func": func}, func_globals)
    return func_globals[func_name]

_arg_template = """    %s (%s) : %s
        (default: %r)
"""
_doc_template = """ Configure and add :class:`~bokeh.models.%s.%s` glyphs to this Figure.

Args:
%s

Keyword Args:
%s

Other Parameters:
    alpha (float) : an alias to set all alpha keyword args at once
    color (Color) : an alias to set all color keyword args at once
    source (ColumnDataSource) : a user supplied data source
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

def _add_sigfunc_info(func, argspecs, glyphclass, extra_docs):
    func.__name__ = glyphclass.__name__

    omissions = {'js_event_callbacks', 'js_property_callbacks', 'subscribed_events'}

    kwlines = []
    kws = glyphclass.properties() - set(argspecs)
    for kw in kws:
        # these are not really useful, and should also really be private, just skip them
        if kw in omissions: continue

        descriptor = getattr(glyphclass, kw)
        typ = descriptor.property._sphinx_type()
        if descriptor.__doc__:
            desc = "\n        ".join(textwrap.dedent(descriptor.__doc__).split("\n"))
        else:
            desc = ""
        kwlines.append(_arg_template % (kw, typ, desc, descriptor.class_default(glyphclass)))
    extra_kws = getattr(glyphclass, '_extra_kws', {})
    for kw, (typ, desc) in extra_kws.items():
        kwlines.append("    %s (%s) : %s" % (kw, typ, desc))
    kwlines.sort()

    arglines = []
    for arg, spec in argspecs.items():
        arglines.append(_arg_template % (arg, spec['type'], spec['desc'], spec['default']))

    mod = "markers" if issubclass(glyphclass, Marker) else "glyphs"
    func.__doc__ = _doc_template % (mod, func.__name__, "\n".join(arglines), "\n".join(kwlines))
    if extra_docs:
        func.__doc__ += extra_docs

def _glyph_function(glyphclass, extra_docs=None):

    def func(self, **kwargs):

        # Convert data source, if necesary
        is_user_source = kwargs.get('source', None) is not None
        if is_user_source:
            source = kwargs['source']
            if not isinstance(source, ColumnarDataSource):
                try:
                    # try converting the soruce to ColumnDataSource
                    source = ColumnDataSource(source)
                except ValueError as err:
                    msg = "Failed to auto-convert {curr_type} to ColumnDataSource.\n Original error: {err}".format(
                        curr_type=str(type(source)),
                        err=err.message
                    )
                    reraise(ValueError, ValueError(msg), sys.exc_info()[2])

                # update reddered_kws so that others can use the new source
                kwargs['source'] = source

        # Process legend kwargs and remove legend before we get going
        legend_item_label = _get_legend_item_label(kwargs)

        # Need to check if user source is present before _pop_renderer_args
        renderer_kws = _pop_renderer_args(kwargs)
        source = renderer_kws['data_source']

        # Assign global_alpha from alpha if glyph type is an image
        if 'alpha' in kwargs and glyphclass.__name__ in ('Image', 'ImageRGBA', 'ImageURL'):
            kwargs['global_alpha'] = kwargs['alpha']

        # handle the main glyph, need to process literals
        glyph_ca = _pop_colors_and_alpha(glyphclass, kwargs)
        incompatible_literal_spec_values = []
        incompatible_literal_spec_values += _process_sequence_literals(glyphclass, kwargs, source, is_user_source)
        incompatible_literal_spec_values += _process_sequence_literals(glyphclass, glyph_ca, source, is_user_source)
        if incompatible_literal_spec_values:
            raise RuntimeError(_GLYPH_SOURCE_MSG % nice_join(incompatible_literal_spec_values, conjuction="and"))

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

        # handle the mute glyph, if any properties were given
        if any(x.startswith('muted_') for x in kwargs):
            mglyph_ca = _pop_colors_and_alpha(glyphclass, kwargs, prefix='muted_')
        else:
            mglyph_ca = None

        glyph = _make_glyph(glyphclass, kwargs, glyph_ca)
        nsglyph = _make_glyph(glyphclass, kwargs, nsglyph_ca)
        sglyph = _make_glyph(glyphclass, kwargs, sglyph_ca)
        hglyph = _make_glyph(glyphclass, kwargs, hglyph_ca)
        mglyph = _make_glyph(glyphclass, kwargs, mglyph_ca)

        glyph_renderer = GlyphRenderer(glyph=glyph,
                                       nonselection_glyph=nsglyph,
                                       selection_glyph=sglyph,
                                       hover_glyph=hglyph,
                                       muted_glyph=mglyph,
                                       **renderer_kws)

        if legend_item_label:
            _update_legend(self, legend_item_label, glyph_renderer)

        self.renderers.append(glyph_renderer)

        return glyph_renderer

    argspecs = _get_argspecs(glyphclass)

    sigfunc = _get_sigfunc(glyphclass.__name__.lower(), func, argspecs)

    sigfunc.glyph_method = True

    _add_sigfunc_info(sigfunc, argspecs, glyphclass, extra_docs)

    return sigfunc
