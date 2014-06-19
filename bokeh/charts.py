"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.
"""
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

import itertools
import warnings

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .glyphs import (Asterisk, Circle, Cross, Diamond, InvertedTriangle, Line,
                     MultiLine, Patches, Square, Text, Triangle, Xmarker, Quad)
from .mplexporter.exporter import Exporter
from .mplexporter.renderers import Renderer
from .mpl_helpers import (convert_dashes, delete_last_col, get_props_cycled,
                          is_ax_end, xkcd_line)
from .objects import (BoxSelectionOverlay, BoxSelectTool, BoxZoomTool,
                      ColumnDataSource, DataRange1d, DatetimeTickFormatter,
                      DatetimeAxis, Glyph, Grid, GridPlot, LinearAxis, PanTool,
                      Plot, PreviewSaveTool, ResetTool, WheelZoomTool)
from .plotting import (curdoc, output_file, output_notebook, output_server,
                       show)

from bokeh import load_notebook
from .document import Document
from .embed import file_html
from .resources import INLINE
from .browserlib import view

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

notebook_loaded = False


class Chart(object):

    def __init__(self, title, xname, yname, xscale, yscale, width, height, filename, notebook):
        "Initial setup."
        self.doc = Document()
        self.source = ColumnDataSource()
        self.xdr = DataRange1d()
        self.ydr = DataRange1d()
        self.title = title
        self.xname = xname
        self.yname = yname
        self.xscale = xscale
        self.yscale = yscale
        self.width = width
        self.height = height
        self.filename = filename
        self.notebook = notebook
        self.plot = Plot(title=self.title,
                         #self.xname
                         #self.yname
                         data_sources=[self.source],
                         x_range=self.xdr,
                         y_range=self.ydr,
                         plot_width=self.width,
                         plot_height=self.height)

        # Add axis
        xaxis = self.make_axis(0, self.xscale)
        yaxis = self.make_axis(1, self.yscale)

        # Add grids
        self.make_grid(xaxis, 0)
        self.make_grid(yaxis, 1)

        # Add tools
        #pantool = PanTool(dimensions=['width', 'height'])
        #wheelzoom = WheelZoomTool(dimensions=['width', 'height'])
        #reset = ResetTool(plot=self.plot)
        #previewsave = PreviewSaveTool(plot=self.plot)
        #self.plot.tools = [pantool, wheelzoom, reset, previewsave]

        # Add to document
        self.doc.add(self.plot)

    def make_axis(self, dimension, scale):
        if scale == "linear":
            axis = LinearAxis(plot=self.plot,
                               dimension=dimension,
                               location="min")
        elif scale == "date":
            axis = DatetimeAxis(plot=self.plot,
                                 dimension=dimension,
                                 location="min")

        return axis

    def make_grid(self, axis, dimension):
        grid = Grid(plot=self.plot,
                    dimension=dimension,
                    axis=axis)

        return grid

    def get_data(self):
        #self.x = np.linspace(-2 * np.pi, 2 * np.pi, 1000)
        #self.y = np.sin(self.x)

        import scipy.special

        self.mu, self.sigma = 0, 0.5
        self.measured = np.random.normal(self.mu, self.sigma, 1000)
        self.hist, self.edges = np.histogram(self.measured, density=True, bins=50)

        # compute ideal values
        self.xval = np.linspace(-2, 2, 1000)
        self.pdf = 1/(self.sigma * np.sqrt(2*np.pi)) * np.exp(-(self.xval-self.mu)**2 / (2*self.sigma**2))
        self.cdf = (1+scipy.special.erf((self.xval-self.mu)/np.sqrt(2*self.sigma**2)))/2

    def make_line(self):

        line = Line()
        line.x = self.source.add(self.x)
        line.y = self.source.add(self.y)
        self.xdr.sources.append(self.source.columns(line.x))
        self.ydr.sources.append(self.source.columns(line.y))

        line_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=line)

        self.plot.renderers.append(line_glyph)

    def make_quad(self):

        quad = Quad()
        quad.top = self.source.add(self.top)
        quad.bottom = self.source.add(self.bottom)
        quad.left = self.source.add(self.left)
        quad.right = self.source.add(self.right)
        self.xdr.sources.append(self.source.columns(quad.left))
        self.xdr.sources.append(self.source.columns(quad.right))
        self.ydr.sources.append(self.source.columns(quad.top))
        self.ydr.sources.append(self.source.columns(quad.bottom))

        quad_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=quad)

        self.plot.renderers.append(quad_glyph)

    def histogram(self):
        # Use the `quad` renderer to display the histogram bars.
        self.top = self.hist
        self.bottom = np.zeros(len(self.hist))
        self.left = self.edges[:-1]
        self.right = self.edges[1:]
        self.make_quad()

        self.x = self.xval
        self.y = self.pdf
        self.make_line()

        self.x = self.xval
        self.y = self.cdf
        self.make_line()

    def draw(self):
        global notebook_loaded

        self.get_data()
        self.histogram()

        if self.filename:
            with open(self.filename, "w") as f:
                f.write(file_html(self.doc, INLINE, self.title))
            print("Wrote %s" % self.filename)
            view(self.filename)
        if self.notebook:
            if notebook_loaded is False:
                load_notebook()
                notebook_loaded = True

            import IPython.core.displaypub as displaypub
            from bokeh.embed import notebook_div
            displaypub.publish_display_data('bokeh', {'text/html': notebook_div(self.plot)})

    #def draw_line(self, data, coordinates, style, label, mplobj=None):
        #"Given a mpl line2d instance create a Bokeh Line glyph."
        #_x = data[:, 0]
        #if self.pd_obj is True:
            #try:
                #x = [pd.Period(ordinal=int(i), freq=self.ax.xaxis.freq).to_timestamp() for i in _x]
            #except AttributeError as e: #  we probably can make this one more intelligent later
                #x = _x
        #else:
            #x = _x

        #y = data[:, 1]
        #if self.xkcd:
            #x, y = xkcd_line(x, y)

        #line = Line()
        #line.x = self.source.add(x)
        #line.y = self.source.add(y)
        #self.xdr.sources.append(self.source.columns(line.x))
        #self.ydr.sources.append(self.source.columns(line.y))

        #line.line_color = style['color']
        #line.line_width = style['linewidth']
        #line.line_alpha = style['alpha']
        #line.line_dash = [int(i) for i in style['dasharray'].split(",")]  # str2list(int)
        ##style['zorder'] # not in Bokeh
        ##line.line_join = line2d.get_solid_joinstyle() # not in mplexporter
        ##line.line_cap = cap_style_map[line2d.get_solid_capstyle()] # not in mplexporter
        #if self.xkcd:
            #line.line_width = 3

        #line_glyph = Glyph(data_source=self.source,
                           #xdata_range=self.xdr,
                           #ydata_range=self.ydr,
                           #glyph=line)

        #self.plot.renderers.append(line_glyph)

    #def draw_markers(self, data, coordinates, style, label, mplobj=None):
        #"Given a mpl line2d instance create a Bokeh Marker glyph."
        #x = data[:, 0]
        #y = data[:, 1]

        #marker_map = {
            #"o": Circle,
            #"s": Square,
            #"+": Cross,
            #"^": Triangle,
            #"v": InvertedTriangle,
            #"x": Xmarker,
            #"D": Diamond,
            #"*": Asterisk,
        #}
        #if style['marker'] not in marker_map:
            #warnings.warn("Unable to handle marker: %s" % style['marker'])

        #marker = marker_map[style['marker']]()
        #marker.x = self.source.add(x)
        #marker.y = self.source.add(y)
        #self.xdr.sources.append(self.source.columns(marker.x))
        #self.ydr.sources.append(self.source.columns(marker.y))

        #marker.line_color = style['edgecolor']
        #marker.fill_color = style['facecolor']
        #marker.line_width = style['edgewidth']
        #marker.size = style['markersize']
        #marker.fill_alpha = marker.line_alpha = style['alpha']
        ##style['zorder'] # not in Bokeh

        #marker_glyph = Glyph(data_source=self.source,
                             #xdata_range=self.xdr,
                             #ydata_range=self.ydr,
                             #glyph=marker)

        #self.plot.renderers.append(marker_glyph)

    #def draw_path_collection(self, paths, path_coordinates, path_transforms,
                             #offsets, offset_coordinates, offset_order,
                             #styles, mplobj=None):
        #"""Path not implemented in Bokeh, but we have our own line ans poly
        #collection implementations, so passing here to avoid the NonImplemented
        #error.
        #"""
        #pass

    #def draw_text(self, text, position, coordinates, style,
                  #text_type=None, mplobj=None):
        #"Given a mpl text instance create a Bokeh Text glyph."
        #x, y = position
        #text = Text(x=x, y=y, text=text)

        #alignment_map = {"center": "middle", "top": "top", "bottom": "bottom", "baseline": "bottom"}
        ## baseline not implemented in Bokeh, deafulting to bottom.
        #text.text_alpha = style['alpha']
        #text.text_font_size = "%dpx" % style['fontsize']
        #text.text_color = style['color']
        #text.text_align = style['halign']
        #text.text_baseline = alignment_map[style['valign']]
        #text.text_angle = style['rotation']
        ##style['zorder'] # not in Bokeh

        ### Using get_fontname() works, but it's oftentimes not available in the browser,
        ### so it's better to just use the font family here.
        ##text.text_font = mplText.get_fontname()) not in mplexporter
        ##text.text_font = mplText.get_fontfamily()[0] # not in mplexporter
        ##text.text_font_style = fontstyle_map[mplText.get_fontstyle()] # not in mplexporter
        ### we don't really have the full range of font weights, but at least handle bold
        ##if mplText.get_weight() in ("bold", "heavy"):
            ##text.text_font_style = bold

        #text_glyph = Glyph(data_source=self.source,
                           #xdata_range=self.xdr,
                           #ydata_range=self.ydr,
                           #glyph=text)

        #self.plot.renderers.append(text_glyph)

    #def draw_image(self, imdata, extent, coordinates, style, mplobj=None):
        #pass



    #def make_line_collection(self, col):
        #"Given a mpl collection instance create a Bokeh MultiLine glyph."
        #xydata = col.get_segments()
        #t_xydata = [np.transpose(seg) for seg in xydata]
        #xs = [t_xydata[x][0] for x in range(len(t_xydata))]
        #ys = [t_xydata[x][1] for x in range(len(t_xydata))]
        #if self.xkcd:
            #xkcd_xs = [xkcd_line(xs[i], ys[i])[0] for i in range(len(xs))]
            #xkcd_ys = [xkcd_line(xs[i], ys[i])[1] for i in range(len(ys))]
            #xs = xkcd_xs
            #ys = xkcd_ys

        #multiline = MultiLine()
        #multiline.xs = self.source.add(xs)
        #multiline.ys = self.source.add(ys)
        #self.xdr.sources.append(self.source.columns(multiline.xs))
        #self.ydr.sources.append(self.source.columns(multiline.ys))

        #self.multiline_props(multiline, col)

        #multiline_glyph = Glyph(data_source=self.source,
                                #xdata_range=self.xdr,
                                #ydata_range=self.ydr,
                                #glyph=multiline)

        #self.plot.renderers.append(multiline_glyph)

    #def make_poly_collection(self, col):
        #"Given a mpl collection instance create a Bokeh Patches glyph."
        #paths = col.get_paths()
        #polygons = [paths[i].to_polygons() for i in range(len(paths))]
        #polygons = [np.transpose(delete_last_col(polygon)) for polygon in polygons]
        #xs = [polygons[i][0] for i in range(len(polygons))]
        #ys = [polygons[i][1] for i in range(len(polygons))]

        #patches = Patches()
        #patches.xs = self.source.add(xs)
        #patches.ys = self.source.add(ys)
        #self.xdr.sources.append(self.source.columns(patches.xs))
        #self.ydr.sources.append(self.source.columns(patches.ys))

        #self.patches_props(patches, col)

        #patches_glyph = Glyph(data_source=self.source,
                              #xdata_range=self.xdr,
                              #ydata_range=self.ydr,
                              #glyph=patches)

        #self.plot.renderers.append(patches_glyph)

    #def multiline_props(self, multiline, col):
        #"Takes a mpl collection object to extract and set up some Bokeh multiline properties."
        #colors = get_props_cycled(col, col.get_colors(), fx=lambda x: mpl.colors.rgb2hex(x))
        #widths = get_props_cycled(col, col.get_linewidth())
        #multiline.line_color = self.source.add(colors)
        #multiline.line_width = self.source.add(widths)
        #multiline.line_alpha = col.get_alpha()
        #offset = col.get_linestyle()[0][0]
        #if not col.get_linestyle()[0][1]:
            #on_off = []
        #else:
            #on_off = map(int,col.get_linestyle()[0][1])
        #multiline.line_dash_offset = convert_dashes(offset)
        #multiline.line_dash = list(convert_dashes(tuple(on_off)))

    #def patches_props(self, patches, col):
        #"Takes a mpl collection object to extract and set up some Bokeh patches properties."
        #face_colors = get_props_cycled(col, col.get_facecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        #patches.fill_color = self.source.add(face_colors)
        #edge_colors = get_props_cycled(col, col.get_edgecolors(), fx=lambda x: mpl.colors.rgb2hex(x))
        #patches.line_color = self.source.add(edge_colors)
        #widths = get_props_cycled(col, col.get_linewidth())
        #patches.line_width = self.source.add(widths)
        #patches.line_alpha = col.get_alpha()
        #offset = col.get_linestyle()[0][0]
        #if not col.get_linestyle()[0][1]:
            #on_off = []
        #else:
            #on_off = map(int,col.get_linestyle()[0][1])
        #patches.line_dash_offset = convert_dashes(offset)
        #patches.line_dash = list(convert_dashes(tuple(on_off)))


class Histogram(object):

    def __init__(self, title=None, xname=None, yname=None, xscale="linear", yscale="linear",
                 width=800, height=600, filename=False, notebook=False):
        self.__title = title
        self.xname = xname
        self.yname = yname
        self.xscale = xscale
        self.yscale = yscale
        self.__width = width
        self.__height = height
        self.filename = filename
        self.notebook = notebook

    def title(self, title):
        self._title = title
        return self

    def width(self, width):
        self._width = width
        return self

    def height(self, height):
        self._height = height
        return self

    def draw(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height

        chart = Chart(self._title, self.xname, self.yname, self.xscale, self.yscale,
                      self._width, self._height, self.filename, self.notebook)
        chart.draw()


