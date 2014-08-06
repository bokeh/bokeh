"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the main Chart class which is able to build several plots using the low
level Bokeh API. It setups all the plot characteristics and let you plot
different chart types, taking OrderedDict as the main input. It also supports
the generation of several outputs (file, server, notebook).
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

from ..glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                     DiamondCross, InvertedTriangle, Line, Rect, Segment, Square,
                     SquareCross, SquareX, Triangle, Xmarker, Quad)
from ..objects import (CategoricalAxis, ColumnDataSource, DatetimeAxis,
                      FactorRange, Glyph, Grid, Legend, LinearAxis, PanTool,
                      Plot, PreviewSaveTool, Range1d, ResetTool, WheelZoomTool)

from ..document import Document
from ..session import Session
from ..embed import file_html
from ..resources import INLINE
from ..browserlib import view
from ..utils import publish_display_data

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Chart(object):

    def __init__(self, title, xlabel, ylabel, legend, xscale, yscale, width, height,
                 tools, filename, server, notebook):
        "Initial setup."
        self.title = title
        self.xlabel = xlabel
        self.ylabel = ylabel
        self.legend = legend
        self.xscale = xscale
        self.yscale = yscale
        self.plot_width = width
        self.plot_height = height
        self.tools = tools
        self.filename = filename
        self.server = server
        self.notebook = notebook
        self.source = None
        self.xdr = None
        self.ydr = None
        #self.groups = []
        self.glyphs = []
        self.plot = Plot(title=self.title,
                         data_sources=[self.source],
                         x_range=self.xdr,
                         y_range=self.ydr,
                         plot_width=self.plot_width,
                         plot_height=self.plot_height)
        # To prevent adding a wheelzoom to a categorical plot
        self.categorical = False

    def get_data_bar(self, cat, **value):
        "Take the bar data from the input and calculate the parameters accordingly."
        self.cat = cat
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict, ordered dict
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        self.groups.extend(self.value.keys())

        for i, val in enumerate(self.value.keys()):
            self._set_and_get("", val, self.value[val])
            self._set_and_get("mid", val, self.value[val] / 2)
            self._set_and_get("stacked", val, self.zero + self.value[val] / 2)
            # Grouped
            self._set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # Stacked
            self.zero += self.value[val]

    def get_source_bar(self, stacked):
        "Get the bar data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        if stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

    def get_data_scatter(self, **pairs):
        "Take the scatter data from the input and calculate the parameters accordingly."
        self.data = dict()

        # assuming value is an ordered dict
        self.pairs = pairs

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        self.groups.extend(self.pairs.keys())

        # Grouping
        for i, val in enumerate(self.pairs.keys()):
            xy = self.pairs[val]
            self._set_and_get("x_", val, xy[:, 0])
            self._set_and_get("y_", val, xy[:, 1])

    def get_source_scatter(self):
        "Get the scatter data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)

        x_names, y_names = self.attr[::2], self.attr[1::2]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx), end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(start=starty - 0.1 * (endy - starty), end=endy + 0.1 * (endy - starty))

    def get_data_boxplot(self, cat, marker, outliers, **value):
        "Take the boxplot data from the input and calculate the parameters accordingly."
        self.cat = cat
        self.marker = marker
        self.outliers = outliers
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict for now
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        n_levels = len(self.value.keys())
        step = np.linspace(1, n_levels+1, n_levels, endpoint=False)

        self.groups.extend(self.value.keys())

        for i, level in enumerate(self.value.keys()):

            # Compute quantiles, IQR, etc.
            level_vals = self.value[level]
            q = np.percentile(level_vals, [25, 50, 75])
            iqr = q[2] - q[0]
            # Store indices of outliers as list
            lower, upper = q[1] - 1.5*iqr, q[1] + 1.5*iqr
            outliers = np.where((level_vals > upper) | (level_vals < lower))[0]

            # Store
            self._set_and_get("", level, level_vals)
            self._set_and_get("quantiles", level, q)
            self._set_and_get("outliers", level, outliers)
            self._set_and_get("cat", level, [level + ':' + str(step[i])])
            self._set_and_get("line_y", level, [lower, upper])
            self._set_and_get("x", level, step[i])

    def get_source_boxplot(self):
        "Get the boxplot data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        y_names = self.attr[::6]
        start_y = min(min(self.data[i]) for i in y_names)
        end_y = max(max(self.data[i]) for i in y_names)
        # Expand min/max to encompass IQR line
        start_y = min(end_y, min(self.data[x][0] for x in self.attr[4::6]))
        end_y = max(end_y, max(self.data[x][1] for x in self.attr[4::6]))
        self.ydr = Range1d(start=start_y - 0.1 * (end_y-start_y), end=end_y + 0.1 * (end_y-start_y))

    def start_plot(self):
        # Add axis
        xaxis = self.make_axis("bottom", self.xscale, self.xlabel)
        yaxis = self.make_axis("left", self.yscale, self.ylabel)

        # Add grids
        self.make_grid(xaxis, 0)
        self.make_grid(yaxis, 1)

        # Add tools
        if self.tools:
            if not self.categorical:
                self.plot.tools = []
                pantool = PanTool(dimensions=['width', 'height'])
                self.plot.tools.append(pantool)
                wheelzoom = WheelZoomTool(dimensions=['width', 'height'])
                self.plot.tools.append(wheelzoom)
                reset = ResetTool(plot=self.plot)
                self.plot.tools.append(reset)
            previewsave = PreviewSaveTool(plot=self.plot)
            self.plot.tools.append(previewsave)

    def add_data_plot(self, source, x_range, y_range):
        # Overwrite the source and ranges attributes
        self.source = source
        self.xdr = x_range
        self.ydr = y_range
        # Overwrite the source and ranges in the plot
        self.plot.data_sources = [self.source]
        self.plot.x_range = self.xdr
        self.plot.y_range = self.ydr

    def end_plot(self, groups):
        # Add legend
        if self.legend:
            listed_glyphs = [[glyph] for glyph in self.glyphs]
            self.legends = dict(zip(groups, listed_glyphs))
            if self.legend is True:
                orientation = "top_right"
            else:
                orientation = self.legend
            legend = Legend(plot=self.plot, orientation=orientation, legends=self.legends)
            self.plot.renderers.append(legend)

        # Add to document and session if server output is asked
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

    def make_axis(self, location, scale, label):
        "Create linear, date or categorical axis depending on the scale and dimension."
        if scale == "linear":
            axis = LinearAxis(plot=self.plot,
                              location=location,
                              axis_label=label)
        elif scale == "date":
            axis = DatetimeAxis(plot=self.plot,
                                location=location,
                                axis_label=label)
        elif scale == "categorical":
            axis = CategoricalAxis(plot=self.plot,
                                   location=location,
                                   major_label_orientation=np.pi / 4,
                                   axis_label=label)
            self.categorical = True

        return axis

    def make_grid(self, axis, dimension):
        "Create the grid just passing the axis and dimension."
        grid = Grid(plot=self.plot,
                    dimension=dimension,
                    axis=axis)

        return grid

    def make_segment(self, x0, y0, x1, y1, color, width):
        """ Create a segment """
        segment = Segment(x0=x0, y0=y0, x1=x1, y1=y1, line_color=color, line_width=width)

        self._append_glyph(segment)

    def make_line(self, x, y, color):
        "Create a line glyph and append it to the renderers list."
        line = Line(x=x, y=y, line_color=color)

        self._append_glyph(line)

    def make_quad(self, top, bottom, left, right, color):
        "Create a quad glyph and append it to the renderers list."
        quad = Quad(top=top, bottom=bottom, left=left, right=right,
                    fill_color=color, fill_alpha=0.7, line_color="white", line_alpha=1.0)

        self._append_glyph(quad)

    def make_rect(self, x, y, width, height, color):
        "Create a rect glyph and append it to the renderers list."
        rect = Rect(x=x, y=y, width=width, height=height, fill_color=color,
                    fill_alpha=0.7, line_color='white', line_alpha=1.0)

        self._append_glyph(rect)

    def make_scatter(self, x, y, markertype, color):
        """ Create a marker glyph (for a single point) and append it to the renderers list.
        Args:
            x (int): x-pos of point
            y (int): y-pos of point
            markertype (int/string): Marker type to use (e.g., 2, 'circle', etc.)
            color (string/?): color of point
        """
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

        g = itertools.cycle(_marker_types.keys())
        if isinstance(markertype, int):
            for i in range(markertype):
                shape = next(g)
        else:
            shape = markertype
        scatter = _marker_types[shape](x=x, y=y, size=10,
                                       fill_color=color,
                                       fill_alpha=0.2,
                                       line_color=color,
                                       line_alpha=1.0)

        self._append_glyph(scatter)

    def bar(self, stacked):
        "Use the `rect` renderer to display the bars."
        self.quartet = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.quartet)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(self.quartet):
            if stacked:
                self.make_rect("cat", quartet[2], "width", quartet[0], colors[i])
            else:  # Grouped
                self.make_rect(quartet[3], quartet[1], "width_cat", quartet[0], colors[i])

    def scatter(self):
        "Use different marker renderers to display the incomming groups."
        self.duplet = list(self._chunker(self.attr, 2))
        colors = self._set_colors(self.duplet)

        for i, duplet in enumerate(self.duplet, start=1):
            self.make_scatter(duplet[0], duplet[1], i, colors[i - 1])

    def boxplot(self):
        " Use the `rect`, `scatter`, and `segment` renderers to display the boxplot. "
        self.sextet = list(self._chunker(self.attr, 6))
        colors = self._set_colors(self.sextet)

        # quintet elements are: [data, quantiles, outliers, cat, line_y]
        for i, sextet in enumerate(self.sextet):
            [d, q, outliers, cat, line_y, x] = [self.data[x] for x in sextet]
            self.make_segment(x, line_y[0], x, line_y[1], 'black', 2)
            self.make_quad(q[1], q[0], x-self.width[0]/2., x+self.width[0]/2., colors[i])
            self.make_quad(q[2], q[1], x-self.width[0]/2., x+self.width[0]/2., colors[i])
            if self.outliers and outliers.any():
                for o in d[outliers]:
                    self.make_scatter(x, o, self.marker, colors[i])

    def show(self):
        "Main show function, it shows the plot in file, server and notebook outputs."
        global _notebook_loaded

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
            print("You have a provide a filename (filename='foo' or"
                  " .filename('foo')) to save your plot.")

        if self.server:
            self.session.use_doc(self.servername)
            self.session.load_document(self.doc)
            self.session.show(self.plot)

        if self.notebook:
            from bokeh.embed import notebook_div
            publish_display_data({'text/html': notebook_div(self.plot)})

    ## Some helper methods
    def _append_glyph(self, glyph):
        """ Appends the passed glyph to the renderer. """
        glyph = Glyph(data_source=self.source,
                      xdata_range=self.xdr,
                      ydata_range=self.ydr,
                      glyph=glyph)

        self.plot.renderers.append(glyph)

        self.glyphs.append(glyph)
