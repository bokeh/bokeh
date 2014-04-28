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

from mplexporter.renderers import Renderer

from .mpl_helpers import (convert_dashes, delete_last_col, get_props_cycled,
                          xkcd_line)
from .objects import (Plot, DataRange1d, LinearAxis, ColumnDataSource, Glyph,
                      Grid, PanTool, WheelZoomTool, PreviewSaveTool)
from .glyphs import (Line, Circle, Square, Cross, Triangle, InvertedTriangle,
                     Xmarker, Diamond, Asterisk, MultiLine, Patches, Text)

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

# This is used to accumulate plots generated via the plotting methods in this
# module.  It is used by build_gallery.py.  To activate this feature, simply
# set _PLOTLIST to an empty list; to turn it off, set it back to None.
_PLOTLIST = None


class BokehRenderer(Renderer):

    def __init__(self, xkcd):
        "Initial setup."
        self.fig = None
        #self.sess = session()
        self.xkcd = xkcd
        self.source = ColumnDataSource()
        self.xdr = DataRange1d()
        self.ydr = DataRange1d()

    def open_figure(self, fig, props):
        "Get the main plot properties and create the plot."
        self.width = int(props['figwidth'] * props['dpi'])
        self.height = int(props['figheight'] * props['dpi'])
        self.plot = Plot(data_sources=[self.source],
                         x_range=self.xdr,
                         y_range=self.ydr,
                         width=self.width,
                         height=self.height)

    def close_figure(self, fig):
        "Complete the plot: add tools."

        # Add tools
        pantool = PanTool(dimensions=["width", "height"])
        wheelzoom = WheelZoomTool(dimensions=["width", "height"])
        previewsave = PreviewSaveTool(plot=self.plot)
        self.plot.tools = [pantool, wheelzoom, previewsave]

        # Gallery list
        if _PLOTLIST is not None:
            _PLOTLIST.append(self.plot)

        self.fig = self.plot
        #self.sess.add_plot(self.plot)

    def open_axes(self, ax, props):
        "Get axes data and create the axes and grids"
        # Get axes and grid into class attributes.
        self.ax = ax
        self.grid = ax.get_xgridlines()[0]

        # Add axis
        bxaxis = self.make_axis(ax.xaxis, 0)
        byaxis = self.make_axis(ax.yaxis, 1)

        # Add grids
        self.make_grid(bxaxis, 0)
        self.make_grid(byaxis, 1)

        # Setup collections info
        nones = ("", " ", "None", "none", None)
        cols = [col for col in self.ax.collections if col.get_paths() not in nones]

        # Add collections renderers
        [self.make_line_collection(col) for col in cols if isinstance(col, mpl.collections.LineCollection)]
        [self.make_poly_collection(col) for col in cols if isinstance(col, mpl.collections.PolyCollection)]

    def close_axes(self, ax):
        "Complete the axes adding axes-dependent plot props"
        self.plot.title = ax.get_title()
        background_fill = ax.get_axis_bgcolor()
        if background_fill == 'w':
            background_fill = 'white'
        self.plot.background_fill = background_fill
        if self.xkcd:
            self.plot.title_text_font = "Comic Sans MS, Textile, cursive"
            self.plot.title_text_font_style = "bold"
            self.plot.title_text_color = "black"

    def open_legend(self, legend, props):
        pass

    def close_legend(self, legend):
        pass

    def draw_line(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Line glyph."
        x = data[:, 0]
        y = data[:, 1]
        if self.xkcd:
            x, y = xkcd_line(x, y)

        line = Line()
        line.x = self.source.add(x)
        line.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(line.x))
        self.ydr.sources.append(self.source.columns(line.y))

        line.line_color = style['color']
        line.line_width = style['linewidth']
        line.line_alpha = style['alpha']
        line.line_dash = [int(i) for i in style['dasharray'].split(",")]  # str2list(int)
        #style['zorder'] # not in Bokeh
        #line.line_join = line2d.get_solid_joinstyle() # not in mplexporter
        #line.line_cap = cap_style_map[line2d.get_solid_capstyle()] # not in mplexporter
        if self.xkcd:
            line.line_width = 3

        line_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=line)

        self.plot.renderers.append(line_glyph)

    def draw_markers(self, data, coordinates, style, label, mplobj=None):
        "Given a mpl line2d instance create a Bokeh Marker glyph."
        x = data[:, 0]
        y = data[:, 1]

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
        if style['marker'] not in marker_map:
            warnings.warn("Unable to handle marker: %s" % style['marker'])

        marker = marker_map[style['marker']]()
        marker.x = self.source.add(x)
        marker.y = self.source.add(y)
        self.xdr.sources.append(self.source.columns(marker.x))
        self.ydr.sources.append(self.source.columns(marker.y))

        marker.line_color = style['edgecolor']
        marker.fill_color = style['facecolor']
        marker.line_width = style['edgewidth']
        marker.size = style['markersize']
        marker.fill_alpha = marker.line_alpha = style['alpha']
        #style['zorder'] # not in Bokeh

        marker_glyph = Glyph(data_source=self.source,
                             xdata_range=self.xdr,
                             ydata_range=self.ydr,
                             glyph=marker)

        self.plot.renderers.append(marker_glyph)

    def draw_path_collection(self, paths, path_coordinates, path_transforms,
                             offsets, offset_coordinates, offset_order,
                             styles, mplobj=None):
        """Path not implemented in Bokeh, but we have our own line ans poly
        collection implementations, so passing here to avoid the NonImplemented
        error.
        """
        pass

    def draw_text(self, text, position, coordinates, style,
                  text_type=None, mplobj=None):
        "Given a mpl text instance create a Bokeh Text glyph."
        x, y = position
        text = Text(x=x, y=y, text=text)

        alignment_map = {"center": "middle", "top": "top", "bottom": "bottom", "baseline": "bottom"}
        # baseline not implemented in Bokeh, deafulting to bottom.
        text.text_alpha = style['alpha']
        text.text_font_size = "%dpx" % style['fontsize']
        text.text_color = style['color']
        text.text_align = style['halign']
        text.text_baseline = alignment_map[style['valign']]
        text.text_angle = style['rotation']
        #style['zorder'] # not in Bokeh

        ## Using get_fontname() works, but it's oftentimes not available in the browser,
        ## so it's better to just use the font family here.
        #text.text_font = mplText.get_fontname()) not in mplexporter
        #text.text_font = mplText.get_fontfamily()[0] # not in mplexporter
        #text.text_font_style = fontstyle_map[mplText.get_fontstyle()] # not in mplexporter
        ## we don't really have the full range of font weights, but at least handle bold
        #if mplText.get_weight() in ("bold", "heavy"):
            #text.text_font_style = bold

        text_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=text)

        self.plot.renderers.append(text_glyph)

    def draw_image(self, imdata, extent, coordinates, style, mplobj=None):
        pass

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
        #label = ax.get_label()
        #self.text_props(label, laxis, prefix="axis_label_")
        #self.draw_text(label, position, coordinates, style, text_type="axis_label_")

        # To get the tick label format, we look at the first of the tick labels
        # and assume the rest are formatted similarly.
        #ticktext = ax.get_ticklabels()[0]
        #self.text_props(ticktext, laxis, prefix="major_label_")
        #self.draw_text(ticktext, position, coordinates, style, text_type="major_label_")

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

    def make_line_collection(self, col):
        "Given a mpl collection instance create a Bokeh MultiLine glyph."
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

        self.multiline_props(multiline, col)

        multiline_glyph = Glyph(data_source=self.source,
                                xdata_range=self.xdr,
                                ydata_range=self.ydr,
                                glyph=multiline)

        self.plot.renderers.append(multiline_glyph)

    def make_poly_collection(self, col):
        "Given a mpl collection instance create a Bokeh Patches glyph."
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

        self.patches_props(patches, col)

        patches_glyph = Glyph(data_source=self.source,
                              xdata_range=self.xdr,
                              ydata_range=self.ydr,
                              glyph=patches)

        self.plot.renderers.append(patches_glyph)

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