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
