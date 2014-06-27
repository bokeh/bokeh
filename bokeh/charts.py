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
from .palettes import brewer
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

    def get_data_bar(self, cat, **value):
        self.cat = cat
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict, ordered dict
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        # Grouping
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        for i, val in enumerate(self.value.keys()):
            setattr(self, val, self.value[val])
            self.data[val] = getattr(self, val)
            self.attr.append(val)
            setattr(self, "mid" + val, self.value[val] / 2)
            self.data["mid" + val] = getattr(self, "mid" + val)
            self.attr.append("mid" + val)
            setattr(self, "stacked" + val, self.zero + self.value[val] / 2)
            self.data["stacked" + val] = getattr(self, "stacked" + val)
            self.attr.append("stacked" + val)
            # Grouped
            setattr(self, "cat" + val, [c + ":" + str(step[i + 1]) for c in self.cat])
            self.data["cat" + val] = getattr(self, "cat" + val)
            self.attr.append("cat" + val)
            # Stacked
            self.zero += self.value[val]

    def get_source_bar(self, stacked):
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        #self.ydr = DataRange1d(sources=[self.source.columns("height")])
        if stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

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

    def make_rect(self, x, y, width, height, color):

        rect = Rect(x=x, y=y, width=width, height=height, fill_color=color)

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

    def bar(self, stacked):
        # Use the `rect` renderer to display the bars.
        # self.make_rect("cat", self.attr[1], "width", self.attr[0])

        def chunks(l, n):
            "Yield successive n-sized chunks from l."
            for i in range(0, len(l), n):
                yield l[i:i + n]

        self.quartet = list(chunks(self.attr, 4))
        if len(self.quartet) < 3:
            colors = brewer["YlGnBu"][3]
        else:
            colors = brewer["YlGnBu"][len(self.quartet)]

        for i, quartet in enumerate(self.quartet):
            if stacked:
                self.make_rect("cat", quartet[2], "width", quartet[0], colors[i])
            else:  # Grouped
                self.make_rect(quartet[3], quartet[1], "width_cat", quartet[0], colors[i])

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
        self.__notebook = notebook

    def title(self, title):
        self._title = title
        return self

    def width(self, width):
        self._width = width
        return self

    def height(self, height):
        self._height = height
        return self

    def notebook(self, notebook=True):
        self._notebook = notebook
        return self

    # TODO: make more chain methods

    def draw(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook

        chart = Chart(self._title, self.xname, self.yname, self.xscale, self.yscale,
                      self._width, self._height, self.filename, self._notebook)
        chart.get_data_histogram(self.measured, self.bins, self.mu, self.sigma)
        chart.get_source_histogram()
        chart.start_plot()
        chart.histogram()
        chart.end_plot()
        chart.draw()


class Bar(object):

    def __init__(self, cat, value, stacked=False, title=None, xname=None, yname=None,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 filename=False, notebook=False):
        self.cat = cat
        self.value = value
        self.__stacked = stacked
        self.__title = title
        self.xname = xname
        self.yname = yname
        self.xscale = xscale
        self.yscale = yscale
        self.__width = width
        self.__height = height
        self.filename = filename
        self.__notebook = notebook

    def stacked(self, stacked=True):
        self._stacked = stacked
        return self

    def title(self, title):
        self._title = title
        return self

    def width(self, width):
        self._width = width
        return self

    def height(self, height):
        self._height = height
        return self

    def notebook(self, notebook=True):
        self._notebook = notebook
        return self

    # TODO: make more chain methods

    def draw(self):
        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook

        chart = Chart(self._title, self.xname, self.yname, self.xscale, self.yscale,
                      self._width, self._height, self.filename, self._notebook)
        chart.get_data_bar(self.cat, **self.value)
        chart.get_source_bar(self._stacked)
        chart.start_plot()
        chart.bar(self._stacked)
        chart.end_plot()
        chart.draw()