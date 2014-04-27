"Supporting objects and functions to convert Matplotlib objects into Bokeh."
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import warnings
import numpy as np
import matplotlib as mpl

from .mpl_helpers import (convert_color, convert_dashes, delete_last_col,
                          get_props_cycled, xkcd_line)
from .objects import (Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph,
                      Grid, PanTool, WheelZoomTool, PreviewSaveTool,
                      ObjectExplorerTool)
from .glyphs import (Line, Circle, Square, Cross, Triangle, InvertedTriangle,
                     Xmarker, Diamond, Asterisk, MultiLine, Patches)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

# This is used to accumulate plots generated via the plotting methods in this
# module.  It is used by build_gallery.py.  To activate this feature, simply
# set _PLOTLIST to an empty list; to turn it off, set it back to None.
_PLOTLIST = None


class MPLExporter(object):

    def __init__(self):
        pass

    def axes2plot(self, ax, xkcd):
        """ In the matplotlib object model, Axes actually are containers for all
        renderers and basically everything else on a plot.

        This takes an MPL Axes object and returns a list of Bokeh objects
        corresponding to it.
        """

        # Initial plot setup
        source = ColumnDataSource()
        xdr = DataRange1d()
        ydr = DataRange1d()

        plot = Plot(data_sources=[source], x_range=xdr, y_range=ydr)

        # Add axis and grids
        xaxis = self.make_axis(plot, ax.xaxis, 0, xkcd)
        yaxis = self.make_axis(plot, ax.yaxis, 1, xkcd)

        xgrid = self.make_grid(plot, ax.get_xgridlines()[0], xaxis, 0)
        ygrid = self.make_grid(plot, ax.get_xgridlines()[0], yaxis, 1)

        # Setup lines, markers and collections
        nones = ("", " ", "None", "none", None)
        lines = [line for line in ax.lines if line.get_linestyle() not in nones]
        markers = [marker for marker in ax.lines if marker.get_marker() not in nones]
        cols = [col for col in ax.collections if col.get_paths() not in nones]

        # Add renderers
        rends = []
        rends.extend(self.make_line(source, plot.x_range, plot.y_range, line, xkcd) for line in lines)
        rends.extend(self.make_marker(source, plot.x_range, plot.y_range, marker) for marker in markers)
        rends.extend(self.make_line_collection(source, plot.x_range, plot.y_range, col, xkcd)
                         for col in cols if isinstance(col, mpl.collections.LineCollection))
        rends.extend(self.make_poly_collection(source, plot.x_range, plot.y_range, col)
                         for col in cols if isinstance(col, mpl.collections.PolyCollection))
        plot.renderers.extend(rends)

        # Add plot props
        self.plot_props(plot, ax, xkcd)

        # Add tools
        pantool = PanTool(dimensions=["width", "height"])
        wheelzoom = WheelZoomTool(dimensions=["width", "height"])
        previewsave = PreviewSaveTool(plot=plot)
        objectexplorer = ObjectExplorerTool()
        plot.tools = [pantool, wheelzoom, previewsave, objectexplorer]

        if _PLOTLIST is not None:
            _PLOTLIST.append(plot)

        return plot

    def line_props(self, line, line2d):
        "Takes a mpl line2d object to extract and set up some Bokeh line properties."
        cap_style_map = {
            "butt": "butt",
            "round": "round",
            "projecting": "square",
        }
        line.line_color = line2d.get_color()
        line.line_width = line2d.get_linewidth()
        line.line_alpha = line2d.get_alpha()
        # TODO: how to handle dash_joinstyle?
        line.line_join = line2d.get_solid_joinstyle()
        line.line_cap = cap_style_map[line2d.get_solid_capstyle()]
        line.line_dash = convert_dashes(line2d.get_linestyle())
        # setattr(newline, "line_dash_offset", ...)

    def marker_props(self, marker, line2d):
        "Takes a mpl line2d object to extract and set up the Bokeh marker properties."
        marker.line_color = line2d.get_markeredgecolor()
        marker.fill_color = line2d.get_markerfacecolor()
        marker.line_width = line2d.get_markeredgewidth()
        marker.size = line2d.get_markersize()
        # Is this the right way to handle alpha? MPL doesn't seem to distinguish
        marker.fill_alpha = marker.line_alpha = line2d.get_alpha()

    def multiline_props(self, source, multiline, col):
        "Takes a mpl collection object to extract and set up some Bokeh multiline properties."
        colors = get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
        widths = get_props_cycled(col, col.get_linewidth())
        multiline.line_color = source.add(colors)
        multiline.line_width = source.add(widths)
        multiline.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        multiline.line_dash_offset = convert_dashes(offset)
        multiline.line_dash = list(convert_dashes(tuple(on_off)))

    def patches_props(self, source, patches, col):
        "Takes a mpl collection object to extract and set up some Bokeh patches properties."
        face_colors = get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.fill_color = source.add(face_colors)
        edge_colors = get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.line_color = source.add(edge_colors)
        widths = get_props_cycled(col, col.get_linewidth())
        patches.line_width = source.add(widths)
        patches.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        patches.line_dash_offset = convert_dashes(offset)
        patches.line_dash = list(convert_dashes(tuple(on_off)))

    def plot_props(self, plot, ax, xkcd):
        "Takes a mpl axes object to extract and set up some Bokeh plot properties."
        plot.title = ax.get_title()
        background_fill = ax.get_axis_bgcolor()
        if background_fill == 'w':
            background_fill = 'white'
        plot.background_fill = background_fill
        if xkcd:
            plot.title_text_font = "Comic Sans MS, Textile, cursive"
            plot.title_text_font_style = "bold"
            plot.title_text_color = "black"

    def text_props(self, mplText, obj, prefix=""):
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
        setattr(obj, prefix+"text_color", convert_color(mplText.get_color()))
        setattr(obj, prefix+"text_baseline", alignment_map[mplText.get_verticalalignment()])

        # Using get_fontname() works, but it's oftentimes not available in the browser,
        # so it's better to just use the font family here.
        #setattr(obj, prefix+"text_font", mplText.get_fontname())
        setattr(obj, prefix+"text_font", mplText.get_fontfamily()[0])

    def make_axis(self, plot, ax, dimension, xkcd):
        "Given a mpl axes instance, returns a Bokeh LinearAxis object."
        # TODO:
        #  * handle `axis_date`, which treats axis as dates
        #  * handle log scaling
        #  * map `labelpad` to `major_label_standoff`
        #  * deal with minor ticks once BokehJS supports them
        #  * handle custom tick locations once that is added to bokehJS

        laxis = LinearAxis(plot=plot, dimension=dimension, location="min",
                           axis_label=ax.get_label_text())

        # First get the label properties by getting an mpl.Text object
        label = ax.get_label()
        self.text_props(label, laxis, prefix="axis_label_")

        # To get the tick label format, we look at the first of the tick labels
        # and assume the rest are formatted similarly.
        ticktext = ax.get_ticklabels()[0]
        self.text_props(ticktext, laxis, prefix="major_label_")

        #newaxis.bounds = axis.get_data_interval()  # I think this is the right func...

        if xkcd:
            laxis.axis_line_width = 3
            laxis.axis_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.axis_label_text_font_style = "bold"
            laxis.axis_label_text_color = "black"
            laxis.major_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.major_label_text_font_style = "bold"
            laxis.major_label_text_color = "black"

        return laxis

    def make_grid(self, plot, grid, ax, dimension):
        "Given a mpl axes instance, returns a Bokeh Grid object."
        lgrid = Grid(plot=plot, dimension=dimension, axis=ax,
             grid_line_color=grid.get_color(), grid_line_width=grid.get_linewidth())
        return lgrid

    def make_line(self, source, xdr, ydr, line2d, xkcd):
        "Given a mpl line2d instance returns a Bokeh Line glyph."
        xydata = line2d.get_xydata()
        x = xydata[:, 0]
        y = xydata[:, 1]
        if xkcd:
            x, y = xkcd_line(x, y)

        line = Line()
        line.x = source.add(x)
        line.y = source.add(y)
        xdr.sources.append(source.columns(line.x))
        ydr.sources.append(source.columns(line.y))

        self.line_props(line, line2d)
        if xkcd:
            line.line_width = 3

        line_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line)
        return line_glyph

    def make_marker(self, source, xdr, ydr, line2d):
        "Given a mpl line2d instance returns a Bokeh Marker glyph."
        marker_map = {
            "o": Circle,
            "s": Square,
            "+": Cross,
            "^": Triangle,
            "v": InvertedTriangle,
            "x": Xmarker,
            "D": Diamond,
            "*": Asterisk,
        }
        if line2d.get_marker() not in marker_map:
            warnings.warn("Unable to handle marker: %s" % line2d.get_marker())
        marker = marker_map[line2d.get_marker()]()

        xydata = line2d.get_xydata()
        x = xydata[:, 0]
        y = xydata[:, 1]
        marker.x = source.add(x)
        marker.y = source.add(y)
        xdr.sources.append(source.columns(marker.x))
        ydr.sources.append(source.columns(marker.y))

        self.marker_props(marker, line2d)

        marker_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=marker)
        return marker_glyph

    def make_line_collection(self, source, xdr, ydr, col, xkcd):
        "Given a mpl collection instance returns a Bokeh MultiLine glyph."
        xydata = col.get_segments()
        t_xydata = [np.transpose(seg) for seg in xydata]
        xs = [t_xydata[x][0] for x in range(len(t_xydata))]
        ys = [t_xydata[x][1] for x in range(len(t_xydata))]
        if xkcd:
            xkcd_xs = [xkcd_line(xs[i], ys[i])[0] for i in range(len(xs))]
            xkcd_ys = [xkcd_line(xs[i], ys[i])[1] for i in range(len(ys))]
            xs = xkcd_xs
            ys = xkcd_ys

        multiline = MultiLine()
        multiline.xs = source.add(xs)
        multiline.ys = source.add(ys)
        xdr.sources.append(source.columns(multiline.xs))
        ydr.sources.append(source.columns(multiline.ys))

        self.multiline_props(source, multiline, col)

        multiline_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=multiline)
        return multiline_glyph

    def make_poly_collection(self, source, xdr, ydr, col):
        "Given a mpl collection instance returns a Bokeh Patches glyph."
        paths = col.get_paths()
        polygons = [paths[i].to_polygons() for i in range(len(paths))]
        polygons = [np.transpose(delete_last_col(polygon)) for polygon in polygons]
        xs = [polygons[i][0] for i in range(len(polygons))]
        ys = [polygons[i][1] for i in range(len(polygons))]

        patches = Patches()
        patches.xs = source.add(xs)
        patches.ys = source.add(ys)
        xdr.sources.append(source.columns(patches.xs))
        ydr.sources.append(source.columns(patches.ys))

        self.patches_props(source, patches, col)

        patches_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=patches)
        return patches_glyph
