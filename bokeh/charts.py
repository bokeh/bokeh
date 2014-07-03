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

import numpy as np
import pandas as pd

from .glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                     DiamondCross, InvertedTriangle, Line, Rect, Square,
                     SquareCross, SquareX, Triangle, Xmarker, Quad)
from .objects import (CategoricalAxis, ColumnDataSource, DatetimeAxis,
                      FactorRange, Glyph, Grid, Legend, LinearAxis, PanTool,
                      Plot, PreviewSaveTool, Range1d, ResetTool, WheelZoomTool)

from bokeh import load_notebook
from .document import Document
from .session import Session
from .embed import file_html
from .resources import INLINE
from .browserlib import view

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

notebook_loaded = False


class Chart(object):

    def __init__(self, title, xname, yname, legend, xscale, yscale, width, height,
                 filename, server, notebook):
        "Initial setup."
        self.title = title
        self.xname = xname
        self.yname = yname
        self.legend = legend
        self.xscale = xscale
        self.yscale = yscale
        self.plot_width = width
        self.plot_height = height
        self.filename = filename
        self.server = server
        self.notebook = notebook
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.glyphs = []

    def get_data_histogram(self, bins, mu, sigma, **value):
        # calculate hist properties
        import scipy.special

        self.data = dict()

        self.value = value

        self.attr = []

        self.groups.extend(self.value.keys())

        for i, val in enumerate(self.value.keys()):
            setattr(self, val, self.value[val])
            self.data[val] = getattr(self, val)

            hist, edges = np.histogram(self.data[val], density=True, bins=bins)
            setattr(self, "hist" + val, hist)
            self.data["hist" + val] = getattr(self, "hist" + val)
            self.attr.append("hist" + val)
            setattr(self, "edges" + val, edges)
            self.data["edges" + val] = getattr(self, "edges" + val)
            self.attr.append("edges" + val)
            setattr(self, "left" + val, edges[:-1])
            self.data["left" + val] = getattr(self, "left" + val)
            self.attr.append("left" + val)
            setattr(self, "rigth" + val, edges[1:])
            self.data["rigth" + val] = getattr(self, "rigth" + val)
            self.attr.append("rigth" + val)
            setattr(self, "bottom" + val, np.zeros(len(hist)))
            self.data["bottom" + val] = getattr(self, "bottom" + val)
            self.attr.append("bottom" + val)

            self.muandsigma = False

            if mu is not None and sigma is not None:
                self.muandsigma = True

                setattr(self, "x" + val, np.linspace(-2, 2, len(self.data[val])))
                self.data["x" + val] = getattr(self, "x" + val)
                self.attr.append("x" + val)

                pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(self.data["x" + val] - mu) ** 2 / (2 * sigma ** 2))
                setattr(self, "pdf" + val, pdf)
                self.data["pdf" + val] = getattr(self, "pdf" + val)
                self.attr.append("pdf" + val)
                self.groups.append("pdf")

                cdf = (1 + scipy.special.erf((self.data["x" + val] - mu) / np.sqrt(2 * sigma ** 2))) / 2
                setattr(self, "cdf" + val, cdf)
                self.data["cdf" + val] = getattr(self, "cdf" + val)
                self.attr.append("cdf" + val)
                self.groups.append("cdf")

    def get_source_histogram(self):
        self.source = ColumnDataSource(data=self.data)

        if not self.muandsigma:
            x_names, y_names = self.attr[1::5], self.attr[::5]
        else:
            x_names, y_names = self.attr[1::8], self.attr[::8]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx),
                           end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)
        if endy < 1.0:
            endy = 1.0
        self.ydr = Range1d(start=0, end=1.1 * endy)

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

        self.groups.extend(self.value.keys())

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
        if stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

    def get_data_scatter(self, **pairs):
        self.data = dict()

        # assuming value is an ordered dict
        self.pairs = pairs

        # list to save all the attributes we are going to create
        self.attr = []

        self.groups.extend(self.pairs.keys())

        # Grouping
        for i, val in enumerate(self.pairs.keys()):
            xy = self.pairs[val]
            setattr(self, val + "_x", xy[:, 0])
            self.data[val + "_x"] = getattr(self, val + "_x")
            self.attr.append(val + "_x")
            setattr(self, val + "_y", xy[:, 1])
            self.data[val + "_y"] = getattr(self, val + "_y")
            self.attr.append(val + "_y")

    def get_source_scatter(self):
        self.source = ColumnDataSource(self.data)

        x_names, y_names = self.attr[::2], self.attr[1::2]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx), end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(start=starty - 0.1 * (endy - starty), end=endy + 0.1 * (endy - starty))

    def start_plot(self):
        self.plot = Plot(title=self.title,
                         data_sources=[self.source],
                         x_range=self.xdr,
                         y_range=self.ydr,
                         plot_width=self.plot_width,
                         plot_height=self.plot_height)

        # Add axis
        xaxis = self.make_axis(0, self.xscale, self.xname)
        yaxis = self.make_axis(1, self.yscale, self.yname)

        # Add grids
        self.make_grid(xaxis, 0)
        self.make_grid(yaxis, 1)

        # Add tools
        pantool = PanTool(dimensions=['width', 'height'])
        wheelzoom = WheelZoomTool(dimensions=['width', 'height'])
        reset = ResetTool(plot=self.plot)
        previewsave = PreviewSaveTool(plot=self.plot)
        self.plot.tools = [pantool, wheelzoom, reset, previewsave]

    def end_plot(self):
        # Add legend
        if self.legend:
            listed_glyphs = [[glyph] for glyph in self.glyphs]
            self.legends = dict(zip(self.groups, listed_glyphs))
            if self.legend is True:
                orientation = "top_right"
            else:
                orientation = self.legend
            legend = Legend(plot=self.plot, orientation=orientation, legends=self.legends)
            print legend.legends
            self.plot.renderers.append(legend)

        # Add to document
        self.doc = Document()
        self.doc.add(self.plot)
        if self.server:
            if self.server is True:
                self.servername = "untitled"
            else:
                self.servername = self.server
            self.session = Session()
            self.session.use_doc(self.servername)
            self.session.load_document(self.doc)
            self.session.store_document(self.doc)

    def make_axis(self, dimension, scale, name):
        if scale == "linear":
            axis = LinearAxis(plot=self.plot,
                              dimension=dimension,
                              location="min",
                              axis_label=name)
        elif scale == "date":
            axis = DatetimeAxis(plot=self.plot,
                                dimension=dimension,
                                location="min",
                                axis_label=name)
        elif scale == "categorical":
            axis = CategoricalAxis(plot=self.plot,
                                   dimension=dimension,
                                   major_label_orientation=np.pi / 4,
                                   axis_label=name)

        return axis

    def make_grid(self, axis, dimension):
        grid = Grid(plot=self.plot,
                    dimension=dimension,
                    axis=axis)

        return grid

    def make_line(self, x, y, color):

        line = Line(x=x, y=y, line_color=color)

        line_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=line)

        self.plot.renderers.append(line_glyph)
        self.glyphs.append(line_glyph)

    def make_quad(self, top, bottom, left, right, color):

        quad = Quad(top=top, bottom=bottom, left=left, right=right,
                    fill_color=color, fill_alpha=0.7, line_color="white", line_alpha=1.0)

        quad_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=quad)

        self.plot.renderers.append(quad_glyph)
        self.glyphs.append(quad_glyph)

    def make_rect(self, x, y, width, height, color):

        rect = Rect(x=x, y=y, width=width, height=height,
                    fill_color=color, fill_alpha=0.7, line_color="white", line_alpha=1.0)

        rect_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=rect)

        self.plot.renderers.append(rect_glyph)
        self.glyphs.append(rect_glyph)

    def make_scatter(self, x, y, markertype, color):
        from collections import OrderedDict

        _marker_types = OrderedDict([
            ("circle", Circle),
            ("square", Square),
            ("triangle", Triangle),
            ("diamond", Diamond),
            ("inverted_triangle", InvertedTriangle),
            ("asterisk", Asterisk),
            ("cross", Cross),
            ("x", Xmarker),
            ("circle_cross", CircleCross),
            ("circle_x", CircleX),
            ("square_x", SquareX),
            ("square_cross", SquareCross),
            ("diamond_cross", DiamondCross),
            ])
            #"*": Asterisk,
            #"+": Cross,
            #"o": Circle,
            #"ox": CircleX,
            #"o+": CircleCross)

        g = itertools.cycle(_marker_types.keys())
        for i in range(markertype):
            shape = next(g)
        scatter = _marker_types[shape](x=x, y=y, size=10,
                                       fill_color=color,
                                       fill_alpha=0.2,
                                       line_color=color,
                                       line_alpha=1.0)

        scatter_glyph = Glyph(data_source=self.source,
                           xdata_range=self.xdr,
                           ydata_range=self.ydr,
                           glyph=scatter)

        self.plot.renderers.append(scatter_glyph)
        self.glyphs.append(scatter_glyph)

    def histogram(self):
        # Use the `quad` renderer to display the histogram bars.
        if not self.muandsigma:
            self.quintet = list(self.chunker(self.attr, 5))
            colors = self.set_colors(self.quintet)

            for i, quintet in enumerate(self.quintet):
                self.make_quad(quintet[0], quintet[4], quintet[2], quintet[3], colors[i])
        else:
            self.octet = list(self.chunker(self.attr, 8))
            colors = self.set_colors(self.octet)

            for i, octet in enumerate(self.octet):
                self.make_quad(octet[0], octet[4], octet[2], octet[3], colors[i])
                self.make_line(octet[5], octet[6], colors[i])
                self.make_line(octet[5], octet[7], colors[i])

    def bar(self, stacked):
        # Use the `rect` renderer to display the bars.
        self.quartet = list(self.chunker(self.attr, 4))
        colors = self.set_colors(self.quartet)

        for i, quartet in enumerate(self.quartet):
            if stacked:
                self.make_rect("cat", quartet[2], "width", quartet[0], colors[i])
            else:  # Grouped
                self.make_rect(quartet[3], quartet[1], "width_cat", quartet[0], colors[i])

    def scatter(self):
        # Use the several "marker" renderers depending of the incomming groups
        self.duplet = list(self.chunker(self.attr, 2))
        colors = self.set_colors(self.duplet)

        for i, duplet in enumerate(self.duplet, start=1):
            self.make_scatter(duplet[0], duplet[1], i, colors[i - 1])

    def draw(self):
        global notebook_loaded

        if self.filename:
            if self.filename is True:
                filename = "untitled"
            else:
                filename = self.filename
            with open(filename, "w") as f:
                f.write(file_html(self.doc, INLINE, self.title))
            print("Wrote %s" % filename)
            view(filename)
        elif self.filename is False and self.server is False and self.notebook is False:
            print("You have a provide a filename (filename='blablabla' or"
                  " .filename('blablabla')) to save your plot.")

        if self.server:
            self.session.use_doc(self.servername)
            self.session.load_document(self.doc)
            self.session.show(self.plot)

        if self.notebook:
            if notebook_loaded is False:
                load_notebook()
                notebook_loaded = True

            import IPython.core.displaypub as displaypub
            from bokeh.embed import notebook_div
            displaypub.publish_display_data('bokeh', {'text/html': notebook_div(self.plot)})

    # Some helper methods
    #def setandget(self):
        #setattr(self, "hist" + val, hist)
        #self.data["hist" + val] = getattr(self, "hist" + val)
        #self.attr.append("hist" + val)

    def chunker(self, l, n):
        "Yield successive n-sized chunks from l."
        for i in range(0, len(l), n):
            yield l[i:i + n]

    def set_colors(self, chunk):
        # TODO: change to a generator to cycle the pallete
        colors = []

        pal = ["#f22c40", "#5ab738", "#407ee7", "#c33ff3"]
        #g = itertools.cycle(brewer["Spectral"][11])
        g = itertools.cycle(pal)
        for i in range(len(chunk)):
            colors.append(next(g))

        return colors


class ChartObject(object):

    def __init__(self, title=None, xname=None, yname=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 filename=False, server=False, notebook=False):
        self.__title = title
        self.__xname = xname
        self.__yname = yname
        self.__legend = legend
        self.xscale = xscale
        self.yscale = yscale
        self.__width = width
        self.__height = height
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook

    def title(self, title):
        self._title = title
        return self

    def xname(self, xname):
        self._xname = xname
        return self

    def yname(self, yname):
        self._yname = yname
        return self

    def legend(self, legend):
        self._legend = legend
        return self

    def width(self, width):
        self._width = width
        return self

    def height(self, height):
        self._height = height
        return self

    def filename(self, filename):
        self._filename = filename
        return self

    def server(self, server):
        self._server = server
        return self

    def notebook(self, notebook=True):
        self._notebook = notebook
        return self

    # TODO: make more chain methods

    def check_attr(self):
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_xname'):
            self._xname = self.__xname
        if not hasattr(self, '_yname'):
            self._yname = self.__yname
        if not hasattr(self, '_legend'):
            self._legend = self.__legend
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_filename'):
            self._filename = self.__filename
        if not hasattr(self, '_server'):
            self._server = self.__server
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook

    def draw(self):
        pass


class Histogram(ChartObject):

    def __init__(self, measured, bins, mu=None, sigma=None,
                 title=None, xname=None, yname=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 filename=False, server=False, notebook=False):
        self.measured = measured
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
        super(Histogram, self).__init__(title, xname, yname, legend,
                                        xscale, yscale, width, height,
                                        filename, server, notebook)

    def check_attr(self):
        super(Histogram, self).check_attr()

    def draw(self):
        self.check_attr()

        chart = Chart(self._title, self._xname, self._yname, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._filename, self._server, self._notebook)
        chart.get_data_histogram(self.bins, self.mu, self.sigma, **self.measured)
        chart.get_source_histogram()
        chart.start_plot()
        chart.histogram()
        chart.end_plot()
        chart.draw()


class Bar(ChartObject):

    def __init__(self, value, cat=None, stacked=False,
                 title=None, xname=None, yname=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 filename=False, server=False, notebook=False):
        self.cat = cat
        self.value = value
        self.__stacked = stacked
        super(Bar, self).__init__(title, xname, yname, legend,
                                  xscale, yscale, width, height,
                                  filename, server, notebook)

    def stacked(self, stacked=True):
        self._stacked = stacked
        return self

    def check_attr(self):
        super(Bar, self).check_attr()

        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def draw(self):
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.index.values.tolist()

        self.check_attr()

        chart = Chart(self._title, self._xname, self._yname, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._filename, self._server, self._notebook)
        chart.get_data_bar(self.cat, **self.value)
        chart.get_source_bar(self._stacked)
        chart.start_plot()
        chart.bar(self._stacked)
        chart.end_plot()
        chart.draw()


class Scatter(ChartObject):

    def __init__(self, pairs,
                 title=None, xname=None, yname=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 filename=False, server=False, notebook=False):
        self.pairs = pairs
        super(Scatter, self).__init__(title, xname, yname, legend,
                                      xscale, yscale, width, height,
                                      filename, server, notebook)

    def check_attr(self):
        super(Scatter, self).check_attr()

    def draw(self):
        # asumming we get an hierchiral pandas object
        if isinstance(self.pairs, pd.DataFrame):
            from collections import OrderedDict
            pdict = OrderedDict()

            for i in self.pairs.columns.levels[0].values:
                pdict[i] = self.pairs[i].dropna().values

            self.pairs = pdict

        # asumming we get an groupby object
        if isinstance(self.pairs, pd.core.groupby.DataFrameGroupBy):
            from collections import OrderedDict
            pdict = OrderedDict()

            for i in self.pairs.groups.keys():
                xname = self.pairs.get_group(i).columns[0]
                yname = self.pairs.get_group(i).columns[1]
                x = getattr(self.pairs.get_group(i), xname)
                y = getattr(self.pairs.get_group(i), yname)
                pdict[i] = np.array([x.values, y.values]).T

            self.pairs = pdict

        self.check_attr()

        chart = Chart(self._title, self._xname, self._yname, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._filename, self._server, self._notebook)
        chart.get_data_scatter(**self.pairs)
        chart.get_source_scatter()
        chart.start_plot()
        chart.scatter()
        chart.end_plot()
        chart.draw()