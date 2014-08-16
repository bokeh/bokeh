"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the main Chart class which is able to build several plots using the low
level Bokeh API. It setups all the plot characteristics and lets you plot
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
                      DiamondCross, InvertedTriangle, Line, Rect, Segment,
                      Square, SquareCross, SquareX, Triangle, Xmarker, Quad)
from ..objects import (CategoricalAxis, DatetimeAxis, Glyph, Grid, Legend,
                       LinearAxis, PanTool, Plot, PreviewSaveTool, ResetTool,
                       WheelZoomTool)

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
    """This is the main Chart class, the core of the `Bokeh.charts` interface.

    This class essentially set up a "universal" Plot object containing all the
    needed attributes and methods to draw any of the Charts that you can build
    subclassing the ChartObject class.
    """
    def __init__(self, title, xlabel, ylabel, legend, xscale, yscale, width, height,
                 tools, filename, server, notebook):
        """Common arguments to be used by all the inherited classes.

        Args:
            title (str): the title of your plot.
            xlabel (str): the x-axis label of your plot.
            ylabel (str): the y-axis label of your plot.
            legend (str): the legend of your plot. The legend content is
                inferred from incoming input.It can be `top_left`,
                `top_right`, `bottom_left`, `bottom_right`.
                It is `top_right` is you set it as True.
            xscale (str): the x-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
            yscale (str): the y-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
            width (int): the width of your plot in pixels.
            height (int): the height of you plot in pixels.
            tools (bool): to enable or disable the tools in your plot.
            filename (str or bool): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                "untitled" as a filename.
            server (str or bool): the name of your plot in the server.
                If you pass True to this argument, it will use "untitled"
                as the name in the server.
            notebook (bool): if you want to output (or not) your plot into the
                IPython notebook.

        Attributes:
            _source (obj): datasource object for your plot,
                initialized as a dummy None.
            _xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            _ydr (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            plot (obj): main Plot object.
            categorical (bool): tag to prevent adding a wheelzoom to a
                categorical plot.
            glyphs (list): to keep track of the glyphs added to the plot.
        """
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
        self._source = None
        self._xdr = None
        self._ydr = None
        self.plot = Plot(title=self.title,
                         data_sources=[self._source],
                         x_range=self._xdr,
                         y_range=self._ydr,
                         plot_width=self.plot_width,
                         plot_height=self.plot_height)
        self.categorical = False
        self.glyphs = []

    def start_plot(self):
        "Add the axis, grids and tools to self.plot"
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
        """Add source and range data to the initialized empty attributes.

        Args:
            source (obj): datasource object for your `self.plot`.
            xdr (obj): x-associated datarange object for your `self.plot`.
            ydr (obj): y-associated datarange object for your `self.plot`.
        """
        # Overwrite the source and ranges in the plot
        self.plot.data_sources = [source]
        self.plot.x_range = x_range
        self.plot.y_range = y_range

    def end_plot(self, groups):
        """Add the legend to your plot, and the plot to a new Document.

        It also add the Document to a new Session in the case of server output.

        Args:
            groups(list): keeping track of the incoming groups of data.
                Useful to automatically setup the legend.
        """
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
        """Create linear, date or categorical axis depending on the location,
        scale and with the proper labels.

        Args:
            location(str): the space localization of the axis. It can be
                `left`, `right`, `below` or `above`.
            scale (str): the scale on the axis. It can be `linear`, `date`
                or `categorical`.
            label (str): the label on the axis.
        """
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
        """Create the grid just passing the axis and dimension.

        Args:
            axis (obj): the axis object
            dimension(int): the dimension of the axis, ie. xaxis=0, yaxis=1.
        """
        grid = Grid(plot=self.plot,
                    dimension=dimension,
                    axis=axis)

        return grid

    def make_segment(self, x0, y0, x1, y1, color, width):
        """ Create a segment glyph and append it to the plot.renderers list.

        Args:
            x0 (str or list[float]) : values or field names of starting `x` coordinates
            y0 (str or list[float]) : values or field names of starting `y` coordinates
            x1 (str or list[float]) : values or field names of ending `x` coordinates
            y1 (str or list[float]) : values or field names of ending `y` coordinates
            color (str): the segment color
            width (int): the segment width
        """
        segment = Segment(x0=x0, y0=y0, x1=x1, y1=y1, line_color=color, line_width=width)

        self._append_glyph(segment)

    def make_line(self, x, y, color):
        """Create a line glyph and append it to the plot.renderers list.

        Args:
            x (str or list[float]) : values or field names of line `x` coordinates
            y (str or list[float]) : values or field names of line `y` coordinates
            color (str): the line color
        """
        line = Line(x=x, y=y, line_color=color)

        self._append_glyph(line)

    def make_quad(self, top, bottom, left, right, color):
        """Create a quad glyph and append it to the plot.renderers list.

        Args:
            left (str or list[float]) : values or field names of left edges
            right (str or list[float]) : values or field names of right edges
            top (str or list[float]) : values or field names of top edges
            bottom (str or list[float]) : values or field names of bottom edges
            color (str): the fill color
        """
        quad = Quad(top=top, bottom=bottom, left=left, right=right,
                    fill_color=color, fill_alpha=0.7, line_color="white", line_alpha=1.0)

        self._append_glyph(quad)

    def make_rect(self, x, y, width, height, color):
        """Create a rect glyph and append it to the renderers list.

        Args:
            x (str or list[float]) : values or field names of center `x` coordinates
            y (str or list[float]) : values or field names of center `y` coordinates
            width (str or list[float]) : values or field names of widths
            height (str or list[float]) : values or field names of heights
            color (str): the fill color
        """
        rect = Rect(x=x, y=y, width=width, height=height, fill_color=color,
                    fill_alpha=0.7, line_color='white', line_alpha=1.0)

        self._append_glyph(rect)

    def make_scatter(self, x, y, markertype, color):
        """Create a marker glyph and appends it to the renderers list.

        Args:
            x (str or list[float]) : values or field names of line `x` coordinates
            y (str or list[float]) : values or field names of line `y` coordinates
            markertype (int or str): Marker type to use (e.g., 2, 'circle', etc.)
            color (str): color of point
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
        """Main show function.

        It shows the plot in file, server and notebook outputs.
        """
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
        """Append the passed glyphs to the plot.renderer.

        Args:
            glyph (obj): the glyph to be appended
        """
        glyph = Glyph(data_source=self.plot.data_sources[0],
                      xdata_range=self.plot.x_range,
                      ydata_range=self.plot.y_range,
                      glyph=glyph)

        self.plot.renderers.append(glyph)

        self.glyphs.append(glyph)
