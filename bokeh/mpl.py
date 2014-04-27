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
        # Initial plot setup
        self.source = ColumnDataSource()
        self.xdr = DataRange1d()
        self.ydr = DataRange1d()

        self.plot = Plot(data_sources=[self.source], x_range=self.xdr, y_range=self.ydr)

    def axes2plot(self, axes, xkcd):
        """ In the matplotlib object model, Axes actually are containers for all
        renderers and basically everything else on a plot.

        This takes an MPL Axes object and returns a list of Bokeh objects
        corresponding to it.
        """
        # Get mpl axes and xkcd parameter
        self.ax = axes
        self.grid = axes.get_xgridlines()[0]
        self.xkcd = xkcd

        # Add axis and grids
        mxaxis = self.ax.xaxis
        myaxis = self.ax.yaxis
        bxaxis = self.make_axis(mxaxis, 0)
        byaxis = self.make_axis(myaxis, 1)

        xgrid = self.make_grid(bxaxis, 0)
        ygrid = self.make_grid(byaxis, 1)

        # Setup lines, markers and collections
        nones = ("", " ", "None", "none", None)
        lines = [line for line in self.ax.lines if line.get_linestyle() not in nones]
        markers = [marker for marker in self.ax.lines if marker.get_marker() not in nones]
        cols = [col for col in self.ax.collections if col.get_paths() not in nones]

        # Add renderers
        rends = []
        rends.extend(self.make_line(line) for line in lines)
        rends.extend(self.make_marker(marker) for marker in markers)
        rends.extend(self.make_line_collection(col) for col in cols
                     if isinstance(col, mpl.collections.LineCollection))
        rends.extend(self.make_poly_collection(col) for col in cols
                     if isinstance(col, mpl.collections.PolyCollection))
        self.plot.renderers.extend(rends)

        # Add plot props
        self.plot_props()

        # Add tools
        pantool = PanTool(dimensions=["width", "height"])
        wheelzoom = WheelZoomTool(dimensions=["width", "height"])
        previewsave = PreviewSaveTool(plot=self.plot)
        objectexplorer = ObjectExplorerTool()
        self.plot.tools = [pantool, wheelzoom, previewsave, objectexplorer]

        if _PLOTLIST is not None:
            _PLOTLIST.append(self.plot)

        return self.plot

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

    def multiline_props(self, multiline, col):
        "Takes a mpl collection object to extract and set up some Bokeh multiline properties."
        colors = get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
        widths = get_props_cycled(col, col.get_linewidth())
        multiline.line_color = self.source.add(colors)
        multiline.line_width = self.source.add(widths)
        multiline.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        multiline.line_dash_offset = convert_dashes(offset)
        multiline.line_dash = list(convert_dashes(tuple(on_off)))

    def patches_props(self, patches, col):
        "Takes a mpl collection object to extract and set up some Bokeh patches properties."
        face_colors = get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.fill_color = self.source.add(face_colors)
        edge_colors = get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        patches.line_color = self.source.add(edge_colors)
        widths = get_props_cycled(col, col.get_linewidth())
        patches.line_width = self.source.add(widths)
        patches.line_alpha = col.get_alpha()
        offset = col.get_linestyle()[0][0]
        if not col.get_linestyle()[0][1]:
            on_off = []
        else:
            on_off = map(int,col.get_linestyle()[0][1])
        patches.line_dash_offset = convert_dashes(offset)
        patches.line_dash = list(convert_dashes(tuple(on_off)))

    def plot_props(self):
        "Takes a mpl axes object to extract and set up some Bokeh plot properties."
        self.plot.title = self.ax.get_title()
        background_fill = self.ax.get_axis_bgcolor()
        if background_fill == 'w':
            background_fill = 'white'
        self.plot.background_fill = background_fill
        if self.xkcd:
            self.plot.title_text_font = "Comic Sans MS, Textile, cursive"
            self.plot.title_text_font_style = "bold"
            self.plot.title_text_color = "black"

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

    def make_axis(self, ax, dimension):
        "Given a mpl axes instance, returns a Bokeh LinearAxis object."
        # TODO:
        #  * handle `axis_date`, which treats axis as dates
        #  * handle log scaling
        #  * map `labelpad` to `major_label_standoff`
        #  * deal with minor ticks once BokehJS supports them
        #  * handle custom tick locations once that is added to bokehJS

        laxis = LinearAxis(plot=self.plot,
                           dimension=dimension,
                           location="min",
                           axis_label=ax.get_label_text())

        # First get the label properties by getting an mpl.Text object
        label = ax.get_label()
        self.text_props(label, laxis, prefix="axis_label_")

        # To get the tick label format, we look at the first of the tick labels
        # and assume the rest are formatted similarly.
        ticktext = ax.get_ticklabels()[0]
        self.text_props(ticktext, laxis, prefix="major_label_")

        #newaxis.bounds = axis.get_data_interval()  # I think this is the right func...

        if self.xkcd:
            laxis.axis_line_width = 3
            laxis.axis_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.axis_label_text_font_style = "bold"
            laxis.axis_label_text_color = "black"
            laxis.major_label_text_font = "Comic Sans MS, Textile, cursive"
            laxis.major_label_text_font_style = "bold"
            laxis.major_label_text_color = "black"

        return laxis

    def make_grid(self, baxis, dimension):
        "Given a mpl axes instance, returns a Bokeh Grid object."
        lgrid = Grid(plot=self.plot,
                     dimension=dimension,
                     axis=baxis,
                     grid_line_color=self.grid.get_color(),
                     grid_line_width=self.grid.get_linewidth())
        return lgrid

    def make_line(self, line2d):
        "Given a mpl line2d instance returns a Bokeh Line glyph."
        xydata = line2d.get_xydata()
        x = xydata[:, 0]
        y = xydata[:, 1]
        if self.xkcd:
            x, y = xkcd_line(x, y)

        line = Line()
        line.x = self.source.add(x)
        line.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(line.x))
        self.ydr.sources.append(self.source.columns(line.y))

        self.line_props(line, line2d)
        if self.xkcd:
            line.line_width = 3

        line_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=line)
        return line_glyph

    def make_marker(self, line2d):
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
        marker.x = self.source.add(x)
        marker.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(marker.x))
        self.ydr.sources.append(self.source.columns(marker.y))

        self.marker_props(marker, line2d)

        marker_glyph = Glyph(data_source=self.source,
                             xdata_range=self.xdr,
                             ydata_range=self.ydr,
                             glyph=marker)
        return marker_glyph

    def make_line_collection(self, col):
        "Given a mpl collection instance returns a Bokeh MultiLine glyph."
        xydata = col.get_segments()
        t_xydata = [np.transpose(seg) for seg in xydata]
        xs = [t_xydata[x][0] for x in range(len(t_xydata))]
        ys = [t_xydata[x][1] for x in range(len(t_xydata))]
        if self.xkcd:
            xkcd_xs = [xkcd_line(xs[i], ys[i])[0] for i in range(len(xs))]
            xkcd_ys = [xkcd_line(xs[i], ys[i])[1] for i in range(len(ys))]
            xs = xkcd_xs
            ys = xkcd_ys

        multiline = MultiLine()
        multiline.xs = self.source.add(xs)
        multiline.ys = self.source.add(ys)
        self.xdr.sources.append(self.source.columns(multiline.xs))
        self.ydr.sources.append(self.source.columns(multiline.ys))

        self.multiline_props(self.source, multiline, col)

        multiline_glyph = Glyph(data_source=self.source,
                                xdata_range=self.xdr,
                                ydata_range=self.ydr,
                                glyph=multiline)
        return multiline_glyph

    def make_poly_collection(self, col):
        "Given a mpl collection instance returns a Bokeh Patches glyph."
        paths = col.get_paths()
        polygons = [paths[i].to_polygons() for i in range(len(paths))]
        polygons = [np.transpose(delete_last_col(polygon)) for polygon in polygons]
        xs = [polygons[i][0] for i in range(len(polygons))]
        ys = [polygons[i][1] for i in range(len(polygons))]

        patches = Patches()
        patches.xs = self.source.add(xs)
        patches.ys = self.source.add(ys)
        self.xdr.sources.append(self.source.columns(patches.xs))
        self.ydr.sources.append(self.source.columns(patches.ys))

        self.patches_props(self.source, patches, col)

        patches_glyph = Glyph(data_source=self.source,
                              xdata_range=self.xdr,
                              ydata_range=self.ydr,
                              glyph=patches)
        return patches_glyph
