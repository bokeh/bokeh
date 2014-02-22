
from collections import Iterable, Sequence
from numbers import Number
import numpy as np
import re
from six import string_types

from . import glyphs
from .objects import (BoxSelectionOverlay, BoxSelectTool, BoxZoomTool,
        ColumnDataSource, CrosshairTool, DataRange1d, DatetimeAxis, EmbedTool,
        Grid, HoverTool, Legend, LinearAxis, PanTool, Plot, PreviewSaveTool,
        ResetTool, ResizeTool, WheelZoomTool, CategoricalAxis, FactorRange)
from .properties import ColorSpec

# This is used to accumulate plots generated via the plotting methods in this
# module.  It is used by build_gallery.py.  To activate this feature, simply
# set _PLOTLIST to an empty list; to turn it off, set it back to None.
_PLOTLIST = None

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
        renderers = [x for x in renderers if x.__view_model__ == "Glyph"]
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
    plot : :py:class:`Plot <bokeh.objects.Plot>`
    """ % (desc, params, props)

def _match_data_params(argnames, glyphclass, datasource, args, kwargs):
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
            dspec = var[:-6]
            if dspec not in glyph_params:
                raise RuntimeError("Cannot set units on undefined field '%s'" % dspec)
            curval = glyph_params[dspec]
            if not isinstance(curval, dict):
                # TODO: This assumes that string values are fields; this is invalid
                # for ColorSpecs, but all this logic is to handle dataspec units, and
                # ColorSpecs do not have units.  However, if there are other kinds of
                # DataSpecs that do have string constants, then we will need to fix
                # this up to have smarter detection of field names.
                if isinstance(curval, string_types):
                    glyph_params[dspec] = {"field": curval, "units": val}
                else:
                    glyph_params[dspec] = {"value": curval, "units": val}
            else:
                glyph_params[dspec]["units"] = val
            continue

        if isinstance(val, dict) or isinstance(val, Number):
            glyph_val = val
        elif isinstance(dataspecs.get(var, None), ColorSpec) and (ColorSpec.isconst(val) or val is None):
            # This check for color constants needs to happen relatively early on because
            # both strings and certain iterables are valid colors.
            glyph_val = val
        elif isinstance(val, string_types):
            if glyphclass == glyphs.Text:
                # TODO (bev) this is hacky, now that text is a DataSpec, it has to be a sequence
                glyph_val = [val]
            else:
                if val not in datasource.column_names:
                    raise RuntimeError("Column name '%s' does not appear in data source %r" % (val, datasource))
                units = getattr(dataspecs[var], 'units', 'data')
                glyph_val = {'field' : val, 'units' : units}
        elif isinstance(val, np.ndarray):
            if val.ndim != 1:
                raise RuntimeError("Columns need to be 1D (%s is not)" % var)
            datasource.add(val, name=var)
            units = getattr(dataspecs[var], 'units', 'data')
            glyph_val = {'field' : var, 'units' : units}
        elif isinstance(val, Iterable):
            datasource.add(val, name=var)
            units = getattr(dataspecs[var], 'units', 'data')
            glyph_val = {'field' : var, 'units' : units}
        else:
            raise RuntimeError("Unexpected column type: %s" % type(val))
        glyph_params[var] = glyph_val
    return glyph_params

def _update_plot_data_ranges(plot, datasource, xcols, ycols):
    """
    Parameters
    ----------
    plot : plot
    datasource : datasource
    xcols : names of columns that are in the X axis
    ycols : names of columns that are in the Y axis
    """
    if isinstance(plot.x_range, DataRange1d):
        x_column_ref = [x for x in plot.x_range.sources if x.source == datasource]
        if len(x_column_ref) > 0:
            x_column_ref = x_column_ref[0]
            for cname in xcols:
                if cname not in x_column_ref.columns:
                    x_column_ref.columns.append(cname)
        else:
            plot.x_range.sources.append(datasource.columns(*xcols))
        plot.x_range._dirty = True

    if isinstance(plot.y_range, DataRange1d):
        y_column_ref = [y for y in plot.y_range.sources if y.source == datasource]
        if len(y_column_ref) > 0:
            y_column_ref = y_column_ref[0]
            for cname in ycols:
                if cname not in y_column_ref.columns:
                    y_column_ref.columns.append(cname)
        else:
            plot.y_range.sources.append(datasource.columns(*ycols))
        plot.y_range._dirty = True

def _materialize_colors_and_alpha(kwargs, prefix="", default_alpha=1.0):
    """
    Given a kwargs dict, a prefix, and a default value, looks for different
    color and alpha fields of the given prefix, and fills in the default value
    if it doesn't exist.
    """
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

def _new_xy_plot(x_range=None, y_range=None, plot_width=None, plot_height=None,
                 x_axis_type="linear", y_axis_type="linear",
                 tools="pan,wheel_zoom,box_zoom,save,resize,select,reset", **kw):
    # Accept **kw to absorb other arguments which the actual factory functions
    # might pass in, but that we don't care about
    p = Plot()
    if _PLOTLIST is not None:
        _PLOTLIST.append(p)

    p.title = kw.pop("title", "Plot")
    if plot_width is not None:
        p.width = plot_width
    if plot_height is not None:
        p.height = plot_height

    if x_range is None:
        x_range = DataRange1d()
    elif isinstance(x_range, Sequence) and isinstance(x_range[0], string_types):
        x_range = FactorRange(factors=x_range)
    p.x_range = x_range
    if y_range is None:
        y_range = DataRange1d()
    elif isinstance(y_range, Sequence) and isinstance(y_range[0], string_types):
        y_range = FactorRange(factors=y_range)
    p.y_range = y_range

    axiscls = None
    if isinstance(x_range, FactorRange):
        axiscls = CategoricalAxis
    elif x_axis_type is "linear":
        axiscls = LinearAxis
    elif x_axis_type == "datetime":
        axiscls = DatetimeAxis
    if axiscls:
        xaxis = axiscls(plot=p, dimension=0, location="min", bounds="auto")

    axiscls = None
    if isinstance(y_range, FactorRange):
        axiscls = CategoricalAxis
    elif y_axis_type is "linear":
        axiscls = LinearAxis
    elif y_axis_type == "datetime":
        axiscls = DatetimeAxis
    if axiscls:
        yaxis = axiscls(plot=p, dimension=1, location="min", bounds="auto")

    xgrid = Grid(plot=p, dimension=0, is_datetime=(x_axis_type == "datetime"))
    ygrid = Grid(plot=p, dimension=1, is_datetime=(y_axis_type == "datetime"))

    border_args = ["min_border", "min_border_top", "min_border_bottom", "min_border_left", "min_border_right"]
    for arg in border_args:
        if arg in kw:
            setattr(p, arg, kw.pop(arg))

    fill_args = ["background_fill", "border_fill"]
    for arg in fill_args:
        if arg in kw:
            setattr(p, arg, kw.pop(arg))

    tool_objs = []

    for tool in re.split(r"\s*,\s*", tools.strip()):
        # re.split will return empty strings; ignore them.
        if tool == "":
            continue
        if tool == "pan":
            tool_obj = PanTool(plot=p, dimensions=["width", "height"])
        elif tool == "wheel_zoom":
            tool_obj = WheelZoomTool(plot=p, dimensions=["width", "height"])
        elif tool == "save":
            tool_obj = PreviewSaveTool(plot=p)
        elif tool == "resize":
            tool_obj = ResizeTool(plot=p)
        elif tool == "crosshair":
            tool_obj = CrosshairTool(plot=p)
        elif tool == "select":
            tool_obj = BoxSelectTool()
            overlay = BoxSelectionOverlay(tool=tool_obj)
            p.renderers.append(overlay)
        elif tool == "box_zoom":
            tool_obj = BoxZoomTool(plot=p)
            overlay = BoxSelectionOverlay(tool=tool_obj)
            p.renderers.append(overlay)
        elif tool == "hover":
            tool_obj = HoverTool(plot=p, tooltips={
                "index": "$index",
                "data (x, y)": "($x, $y)",
                "canvas (x, y)": "($sx, $sy)",
            })
        elif tool == "previewsave":
            tool_obj = PreviewSaveTool(plot=p)
        elif tool == "embed":
            tool_obj = EmbedTool(plot=p)
        elif tool == "reset":
            tool_obj = ResetTool(plot=p)
        else:
            known_tools = "pan, wheel_zoom, box_zoom, save, resize, crosshair, select, previewsave, reset, hover, or embed"
            raise ValueError("invalid tool: %s (expected one of %s)" % (tool, known_tools))

        tool_objs.append(tool_obj)

    p.tools.extend(tool_objs)
    return p


def _handle_1d_data_args(args, datasource=None, create_autoindex=True,
        suggested_names=[]):
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
            if i < len(suggested_names):
                name = suggested_names[i]
            elif i == 0 and create_autoindex:
                name = datasource.add(ary, name="_autoindex")
            else:
                name = datasource.add(ary)
        names.append(name)
    return names, datasource

class _list_attr_splat(list):
    def __setattr__(self, attr, value):
        for x in self:
            setattr(x, attr, value)
