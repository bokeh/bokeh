""" Supporting objects and functions to convert Matplotlib objects into Bokeh

"""

import warnings
import numpy as np
import matplotlib as mpl
from itertools import (cycle, islice)

from scipy import interpolate, signal

from . import glyphs, objects


# This is used to accumulate plots generated via the plotting methods in this
# module.  It is used by build_gallery.py.  To activate this feature, simply
# set _PLOTLIST to an empty list; to turn it off, set it back to None.
_PLOTLIST = None

def axes2plot(axes, xkcd):
    """ In the matplotlib object model, Axes actually are containers for all
    renderers and basically everything else on a plot.

    This takes an MPL Axes object and returns a list of Bokeh objects
    corresponding to it.
    """

    # Get axis background color
    background_fill = axes.get_axis_bgcolor()
    if background_fill == 'w':
        background_fill = 'white'
    title = axes.get_title()
    plot = objects.Plot(title=title, background_fill=background_fill)
    if xkcd:
        plot.title_text_font = "Comic Sans MS, Textile, cursive"
        plot.title_text_font_style = "bold"
        plot.title_text_color = "black"
    if _PLOTLIST is not None:
        _PLOTLIST.append(plot)
    plot.x_range = objects.DataRange1d()
    plot.y_range = objects.DataRange1d()
    datasource = objects.ColumnDataSource()
    plot.data_sources = [datasource]

    bokehaxes = extract_axis(axes, xkcd)
    for baxis in bokehaxes:
        baxis.plot = plot
    plot.renderers.extend(bokehaxes) # + extract_grid(axes))

    # Break up the lines and markers by filtering on linestyle and marker style
    lines = [line for line in axes.lines if line.get_linestyle() not in ("", " ", "None", "none", None)]
    markers = [m for m in axes.lines if m.get_marker() not in ("", " ", "None", "none", None)]
    cols = [col for col in axes.collections if col.get_paths() not in ("", " ", "None", "none", None)]
    renderers = [_make_line(datasource, plot.x_range, plot.y_range, line, xkcd) for line in lines]
    renderers.extend(_make_marker(datasource, plot.x_range, plot.y_range, marker) for marker in markers)
    renderers.extend(_make_lines_collection(datasource, plot.x_range, plot.y_range, col, xkcd) \
                        for col in cols if isinstance(col, mpl.collections.LineCollection))
    renderers.extend(_make_polys_collection(datasource, plot.x_range, plot.y_range, col) \
                        for col in cols if isinstance(col, mpl.collections.PolyCollection))
    plot.renderers.extend(renderers)

    #plot.renderers.extend(map(MPLText.convert, axes.texts))
    #for collection in axes.collections:
    #    if isinstance(collection, mpl.collections.PolyCollection):
    #        plot.renderers.extend(map(MPLPatches.convert, collection))
    #    elif isinstance(collection, mpl.collections.LineCollection):
    #        plot.renderers.extend(map(MPLMultiLine.convert, collection))
    #    else:
    #        warnings.warn("Not yet implemented: %r" % collection)

    # Grid set up
    grid = axes.get_xgridlines()[0]
    grid_line_color = grid.get_color()
    grid_line_width = grid.get_linewidth()
    # xgrid
    objects.Grid(plot=plot, dimension=0, axis=bokehaxes[0],
                         grid_line_color=grid_line_color,
                         grid_line_width=grid_line_width)
    # ygrid
    objects.Grid(plot=plot, dimension=1, axis=bokehaxes[1],
                         grid_line_color=grid_line_color,
                         grid_line_width=grid_line_width)

    # Add tools
    pantool = objects.PanTool(dimensions=["width", "height"])
    wheelzoom = objects.WheelZoomTool(dimensions=["width", "height"])
    plot.tools = [pantool, wheelzoom]
    return plot

def _convert_color(mplcolor):
    charmap = dict(b="blue", g="green", r="red", c="cyan", m="magenta",
                   y="yellow", k="black", w="white")
    if mplcolor in charmap:
        return charmap[mplcolor]

    try:
        colorfloat = float(mplcolor)
        if 0 <= colorfloat <= 1.0:
            # This is a grayscale value
            return tuple([int(255*colorfloat)] * 3)
    except:
        pass

    if isinstance(mplcolor, tuple):
        # These will be floats in the range 0..1
        return int(255*mplcolor[0]), int(255*mplcolor[1]), int(255*mplcolor[2])

    return mplcolor

def _map_text_props(mplText, obj, prefix=""):
    """ Sets various TextProps on a bokeh object based on values from a
    matplotlib Text object.  An optional prefix is added to the TextProps
    field names, to mirror the common use of the TextProps property.
    """
    alignment_map = {"center": "middle", "top": "top", "bottom": "bottom"}  # TODO: support "baseline"
    fontstyle_map = {"oblique": "italic", "normal": "normal", "italic": "italic"}

    setattr(obj, prefix+"text_font_style", fontstyle_map[mplText.get_fontstyle()])
    # we don't really have the full range of font weights, but at least handle bold
    if mplText.get_weight() in ("bold", "heavy"):
        setattr(obj, prefix+"text_font_style", "bold")
    setattr(obj, prefix+"text_font_size", "%dpx" % mplText.get_fontsize())
    setattr(obj, prefix+"text_alpha", mplText.get_alpha())
    setattr(obj, prefix+"text_color", _convert_color(mplText.get_color()))
    setattr(obj, prefix+"text_baseline", alignment_map[mplText.get_verticalalignment()])

    # Using get_fontname() works, but it's oftentimes not available in the browser,
    # so it's better to just use the font family here.
    #setattr(obj, prefix+"text_font", mplText.get_fontname())
    setattr(obj, prefix+"text_font", mplText.get_fontfamily()[0])

def _make_axis(axis, dimension, xkcd):
    """ Given an mpl.Axis instance, returns a bokeh LinearAxis """
    # TODO:
    #  * handle `axis_date`, which treats axis as dates
    #  * handle log scaling
    #  * map `labelpad` to `major_label_standoff`
    #  * deal with minor ticks once BokehJS supports them
    #  * handle custom tick locations once that is added to bokehJS

    newaxis = objects.LinearAxis(dimension=dimension, location="min",
                                 axis_label=axis.get_label_text())

    # First get the label properties by getting an mpl.Text object
    label = axis.get_label()
    _map_text_props(label, newaxis, prefix="axis_label_")

    # To get the tick label format, we look at the first of the tick labels
    # and assume the rest are formatted similarly.
    ticktext = axis.get_ticklabels()[0]
    _map_text_props(ticktext, newaxis, prefix="major_label_")

    #newaxis.bounds = axis.get_data_interval()  # I think this is the right func...

    if xkcd:
        newaxis.axis_line_width = 3
        newaxis.axis_label_text_font = "Comic Sans MS, Textile, cursive"
        newaxis.axis_label_text_font_style = "bold"
        newaxis.axis_label_text_color = "black"
        newaxis.major_label_text_font = "Comic Sans MS, Textile, cursive"
        newaxis.major_label_text_font_style = "bold"
        newaxis.major_label_text_color = "black"

    return newaxis


def extract_axis(mplaxes, xkcd):
    """ Given a matplotlib Axes object, extracts the actual X and Y axes from
    it and returns a set of bokeh objects.
    """
    return _make_axis(mplaxes.xaxis, 0, xkcd), _make_axis(mplaxes.yaxis, 1, xkcd)


#def extract_grid(mplaxes):
#    if mplaxis.xaxis._gridOnMajor:
#        axis = mplaxes.get_xaxis()


def _make_marker(datasource, xdr, ydr, line2d):
    """ Given a matplotlib line2d instance that has non-null marker type,
    return an appropriate Bokeh Marker glyph.
    """
    marker_map = {
        "o": glyphs.Circle,
        "s": glyphs.Square,
        "+": glyphs.Cross,
        "^": glyphs.Triangle,
        "v": glyphs.InvertedTriangle,
        "x": glyphs.Xmarker,
        "D": glyphs.Diamond,
        "*": glyphs.Asterisk,
    }
    if line2d.get_marker() not in marker_map:
        warnings.warn("Unable to handle marker: %s" % line2d.get_marker())
    marker = marker_map[line2d.get_marker()]()
    marker.line_color = line2d.get_markeredgecolor()
    marker.fill_color = line2d.get_markerfacecolor()
    marker.line_width = line2d.get_markeredgewidth()
    marker.size = line2d.get_markersize()

    # Is this the right way to handle alpha? MPL doesn't seem to distinguish
    marker.fill_alpha = marker.line_alpha = line2d.get_alpha()

    xydata = line2d.get_xydata()
    marker.x = datasource.add(xydata[:, 0])
    marker.y = datasource.add(xydata[:, 1])
    xdr.sources.append(datasource.columns(marker.x))
    ydr.sources.append(datasource.columns(marker.y))

    glyph = objects.Glyph(
        data_source = datasource,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = marker
    )
    return glyph


def _map_line_props(newline, line2d):
    cap_style_map = {
        "butt": "butt",
        "round": "round",
        "projecting": "square",
    }
    # Note: these are not *just* the line properties, rather they are
    # the properties to set when a line2d represents a line plot
    setattr(newline, "line_color", line2d.get_color())
    setattr(newline, "line_width", line2d.get_linewidth())
    setattr(newline, "line_alpha", line2d.get_alpha())
    # TODO: how to handle dash_joinstyle?
    setattr(newline, "line_join", line2d.get_solid_joinstyle())
    setattr(newline, "line_cap", cap_style_map[line2d.get_solid_capstyle()])
    # TODO: Handle line dash, translate between Matplotlib and Canvas-style dashes
    setattr(newline, "line_dash", _convert_dashes(line2d.get_linestyle()))
    # setattr(newline, "line_dash_offset", ...)


def _get_props_cycled(col, prop, fx=lambda x: x):
    """ We need to cycle the `get.property` list (where property can be colors,
    line_width, etc) as matplotlib does. We use itertools tools for do this
    cycling ans slice manipulation.

    Parameters:

    col: matplotlib collection object
    prop: property we want to get from matplotlib collection
    fx: funtion (optional) to transform the elements from list obtained
        after the property call. Deafults to identity function.
    """
    n = len(col.get_paths())
    t_prop = [fx(x) for x in prop]
    sliced = islice(cycle(t_prop), None, n)
    return list(sliced)


def _delete_last_col(x):
    x = np.delete(x, (-1), axis=1)
    return x


def _convert_dashes(dash):
    """ Converts a Matplotlib dash specification

    bokeh.properties.DashPattern supports the matplotlib named dash styles,
    but not the little shorthand characters.  This function takes care of
    mapping those.
    """
    mpl_dash_map = {
        "-": "solid",
        "--": "dashed",
        ":": "dotted",
        "-.": "dashdot",
    }
    # If the value doesn't exist in the map, then just return the value back.
    return mpl_dash_map.get(dash, dash)

def _make_line(datasource, xdr, ydr, line2d, xkcd):
    newline = glyphs.Line()
    _map_line_props(newline, line2d)
    xydata = line2d.get_xydata()
    x = xydata[:, 0]
    y = xydata[:, 1]
    if xkcd:
        x, y = xkcd_line(x, y)
        newline.line_width = 3
    newline.x = datasource.add(x)
    newline.y = datasource.add(y)
    xdr.sources.append(datasource.columns(newline.x))
    ydr.sources.append(datasource.columns(newline.y))
    glyph = objects.Glyph(
        data_source = datasource,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = newline
    )
    return glyph

def _make_lines_collection(datasource, xdr, ydr, col, xkcd):
    newmultiline = glyphs.MultiLine()
    xydata = col.get_segments()
    t_xydata = [np.transpose(seg) for seg in xydata]
    xs = [t_xydata[x][0] for x in range(len(t_xydata))]
    ys = [t_xydata[x][1] for x in range(len(t_xydata))]
    if xkcd:
        xkcd_xs = [xkcd_line(xs[i], ys[i])[0] for i in range(len(xs))]
        xkcd_ys = [xkcd_line(xs[i], ys[i])[1] for i in range(len(ys))]
        xs = xkcd_xs
        ys = xkcd_ys
    newmultiline.xs = datasource.add(xs)
    newmultiline.ys = datasource.add(ys)
    colors = _get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
    widths = _get_props_cycled(col, col.get_linewidth())
    newmultiline.line_color = datasource.add(colors)
    newmultiline.line_width = datasource.add(widths)
    newmultiline.line_alpha = col.get_alpha()
    offset = col.get_linestyle()[0][0]
    if not col.get_linestyle()[0][1]:
        on_off = []
    else:
        on_off = map(int,col.get_linestyle()[0][1])
    newmultiline.line_dash_offset = _convert_dashes(offset)
    newmultiline.line_dash = list(_convert_dashes(tuple(on_off)))
    xdr.sources.append(datasource.columns(newmultiline.xs))
    ydr.sources.append(datasource.columns(newmultiline.ys))
    glyph = objects.Glyph(
        data_source = datasource,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = newmultiline
    )
    return glyph


def _make_polys_collection(datasource, xdr, ydr, col):
    newpatches = glyphs.Patches()
    paths = col.get_paths()
    polygons = [paths[i].to_polygons() for i in range(len(paths))]
    polygons = [np.transpose(_delete_last_col(polygon)) for polygon in polygons]
    xs = [polygons[i][0] for i in range(len(polygons))]
    ys = [polygons[i][1] for i in range(len(polygons))]
    newpatches.xs = datasource.add(xs)
    newpatches.ys = datasource.add(ys)
    face_colors = _get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
    newpatches.fill_color = datasource.add(face_colors)
    edge_colors = _get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
    newpatches.line_color = datasource.add(edge_colors)
    widths = _get_props_cycled(col, col.get_linewidth())
    newpatches.line_width = datasource.add(widths)
    newpatches.line_alpha = col.get_alpha()
    offset = col.get_linestyle()[0][0]
    if not col.get_linestyle()[0][1]:
        on_off = []
    else:
        on_off = map(int,col.get_linestyle()[0][1])
    newpatches.line_dash_offset = _convert_dashes(offset)
    newpatches.line_dash = list(_convert_dashes(tuple(on_off)))
    xdr.sources.append(datasource.columns(newpatches.xs))
    ydr.sources.append(datasource.columns(newpatches.ys))
    glyph = objects.Glyph(
        data_source = datasource,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = newpatches
    )
    return glyph

def xkcd_line(x, y, xlim=None, ylim=None, mag=1.0, f1=30, f2=0.001, f3=5):
    """
    Mimic a hand-drawn line from (x, y) data
    Source: http://jakevdp.github.io/blog/2012/10/07/xkcd-style-plots-in-matplotlib/

    Parameters
    ----------
    x, y : array_like
        arrays to be modified
    xlim, ylim : data range
        the assumed plot range for the modification.  If not specified,
        they will be guessed from the  data
    mag : float
        magnitude of distortions
    f1, f2, f3 : int, float, int
        filtering parameters.  f1 gives the size of the window, f2 gives
        the high-frequency cutoff, f3 gives the size of the filter

    Returns
    -------
    x, y : ndarrays
        The modified lines
    """
    x = np.asarray(x)
    y = np.asarray(y)

    # get limits for rescaling
    if xlim is None:
        xlim = (x.min(), x.max())
    if ylim is None:
        ylim = (y.min(), y.max())

    if xlim[1] == xlim[0]:
        xlim = ylim

    if ylim[1] == ylim[0]:
        ylim = xlim

    # scale the data
    x_scaled = (x - xlim[0]) * 1. / (xlim[1] - xlim[0])
    y_scaled = (y - ylim[0]) * 1. / (ylim[1] - ylim[0])

    # compute the total distance along the path
    dx = x_scaled[1:] - x_scaled[:-1]
    dy = y_scaled[1:] - y_scaled[:-1]
    dist_tot = np.sum(np.sqrt(dx * dx + dy * dy))

    # number of interpolated points is proportional to the distance
    Nu = int(200 * dist_tot)
    u = np.arange(-1, Nu + 1) * 1. / (Nu - 1)

    # interpolate curve at sampled points
    k = min(3, len(x) - 1)
    res = interpolate.splprep([x_scaled, y_scaled], s=0, k=k)
    x_int, y_int = interpolate.splev(u, res[0])

    # we'll perturb perpendicular to the drawn line
    dx = x_int[2:] - x_int[:-2]
    dy = y_int[2:] - y_int[:-2]
    dist = np.sqrt(dx * dx + dy * dy)

    # create a filtered perturbation
    coeffs = mag * np.random.normal(0, 0.01, len(x_int) - 2)
    b = signal.firwin(f1, f2 * dist_tot, window=('kaiser', f3))
    response = signal.lfilter(b, 1, coeffs)

    x_int[1:-1] += response * dy / dist
    y_int[1:-1] += response * dx / dist

    # un-scale data
    x_int = x_int[1:-1] * (xlim[1] - xlim[0]) + xlim[0]
    y_int = y_int[1:-1] * (ylim[1] - ylim[0]) + ylim[0]

    return x_int, y_int

class MPLMultiLine(glyphs.MultiLine):

    @classmethod
    def convert(cls, linecollection):
        pass

class MPLText(glyphs.Text):

    @classmethod
    def convert(cls, text):
        return []

class MPLPatches(glyphs.Patches):

    @classmethod
    def convert(cls, patches):
        pass
