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

import numpy as np
import pandas as pd

from .glyphs import (Asterisk, Circle, Cross, Diamond, InvertedTriangle, Line,
                     MultiLine, Patches, Rect, Square, Text, Triangle, Xmarker, Quad)
from .objects import (BoxSelectionOverlay, BoxSelectTool, BoxZoomTool, CategoricalAxis,
                      ColumnDataSource, DataRange1d, DatetimeTickFormatter,
                      DatetimeAxis, FactorRange, Glyph, Grid, GridPlot, LinearAxis, PanTool,
                      Plot, PreviewSaveTool, Range1d, ResetTool, WheelZoomTool)
#from .plotting import (curdoc, output_file, output_notebook, output_server,
                       #show)

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
        self.title = title
        self.xname = xname
        self.yname = yname
        self.xscale = xscale
        self.yscale = yscale
        self.plot_width = width
        self.plot_height = height
        self.filename = filename
        self.notebook = notebook
        self.source = None
        self.xdr = None
        self.ydr = None

    def get_data_histogram(self, measured, bins, mu, sigma):
        # calculate hist properties
        import scipy.special
        self.hist, self.edges = np.histogram(measured, density=True, bins=bins)

        # compute ideal values
        self.xval = np.linspace(-2, 2, len(measured))
        self.pdf = 1/(sigma * np.sqrt(2*np.pi)) * np.exp(-(self.xval-mu)**2 / (2*sigma**2))
        self.cdf = (1+scipy.special.erf((self.xval-mu)/np.sqrt(2*sigma**2)))/2

        # get quad properties
        self.top = self.hist
        self.bottom = np.zeros(len(self.hist))
        self.left = self.edges[:-1]
        self.right = self.edges[1:]

    def get_data_bar(self, cat, value):
        self.cat = cat
        self.height = value
        self.midheight = self.height / 2
        self.width = [0.8] * len(cat)

    def get_source_histogram(self):
        self.source = ColumnDataSource(data=dict(hist=self.hist,
                                                 edges=self.edges,
                                                 xval=self.xval,
                                                 pdf=self.pdf,
                                                 cdf=self.cdf,
                                                 top=self.top,
                                                 bottom=self.bottom,
                                                 left=self.left,
                                                 right=self.right))
        self.xdr = DataRange1d(sources=[self.source.columns("edges")])
        self.ydr = DataRange1d(sources=[self.source.columns("hist")])

    def get_source_bar(self):
        self.source = ColumnDataSource(data=dict(cat=self.cat,
                                                 midheight=self.midheight,
                                                 width=self.width,
                                                 height=self.height))
        self.xdr = FactorRange(factors=self.source.data["cat"])
        #self.ydr = Range1d(start=0, end=30)
        self.ydr = DataRange1d(sources=[self.source.columns("height")])

    def start_plot(self):
        self.plot = Plot(title=self.title,
                         #self.xname
                         #self.yname
                         data_sources=[self.source],
                         x_range=self.xdr,
                         y_range=self.ydr,
                         plot_width=self.plot_width,
                         plot_height=self.plot_height)

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

    def end_plot(self):
        # Add to document
        self.doc = Document()
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
        elif scale == "categorical":
            axis = CategoricalAxis(plot=self.plot,
                                   dimension=dimension,
                                   major_label_orientation=np.pi / 4)

        return axis

    def make_grid(self, axis, dimension):
        grid = Grid(plot=self.plot,
                    dimension=dimension,
                    axis=axis)

        return grid

    def make_line(self, x, y):

        line = Line(x=x, y=y)

        line_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=line)

        self.plot.renderers.append(line_glyph)

    def make_quad(self, top, bottom, left, right):

        quad = Quad(top=top, bottom=bottom, left=left, right=right)

        quad_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=quad)

        self.plot.renderers.append(quad_glyph)

    def make_rect(self, x, y, width, height):

        rect = Rect(x=x, y=y, width=width, height=height, fill_color="#CD7F32", fill_alpha=0.6)

        rect_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=rect)

        self.plot.renderers.append(rect_glyph)

    def histogram(self):
        # Use the `quad` renderer to display the histogram bars.
        self.make_quad("top", "bottom", "left", "right")
        # Add theoretical lines
        self.make_line("xval", "pdf")
        self.make_line("xval", "cdf")

    def bar(self):
        # Use the `rect` renderer to display the bars.
        self.make_rect("cat", "midheight", "width", "height")
        #self.make_line("cat", "midheight")
        #self.make_line("cat", "height")

        #rect(x=countries, y=bronze/2, width=0.8, height=bronze, x_range=countries, color="#CD7F32", alpha=0.6,
             #background_fill='#59636C', title="Olympic Medals by Country (stacked)", tools="",
             #y_range=Range1d(start=0, end=max(gold+silver+bronze)), plot_width=800)
        #rect(x=countries, y=bronze+silver/2, width=0.8, height=silver, x_range=countries, color="silver", alpha=0.6)
        #rect(x=countries, y=bronze+silver+gold/2, width=0.8, height=gold, x_range=countries, color="gold", alpha=0.6)

    def draw(self):
        global notebook_loaded

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


class Histogram(object):

    def __init__(self, measured, bins, mu=None, sigma=None, title=None, xname=None, yname=None,
                 xscale="linear", yscale="linear", width=800, height=600,
                 filename=False, notebook=False):
        self.measured = measured
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
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

    # TODO: make more chain methods

    def draw(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height

        chart = Chart(self._title, self.xname, self.yname, self.xscale, self.yscale,
                      self._width, self._height, self.filename, self.notebook)
        chart.get_data_histogram(self.measured, self.bins, self.mu, self.sigma)
        chart.get_source_histogram()
        chart.start_plot()
        chart.histogram()
        chart.end_plot()
        chart.draw()


class Bar(object):

    def __init__(self, cat, value, title=None, xname=None, yname=None,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 filename=False, notebook=False):
        self.cat = cat
        self.value = value
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

    # TODO: make more chain methods

    def draw(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height

        chart = Chart(self._title, self.xname, self.yname, self.xscale, self.yscale,
                      self._width, self._height, self.filename, self.notebook)
        chart.get_data_bar(self.cat, self.value)
        chart.get_source_bar()
        chart.start_plot()
        chart.bar()
        chart.end_plot()
        chart.draw()