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
from collections import OrderedDict

import numpy as np

from ..glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                      DiamondCross, InvertedTriangle, Line, Rect, Segment,
                      Square, SquareCross, SquareX, Triangle, X, Quad, Patch)
from ..objects import (CategoricalAxis, DatetimeAxis, Grid, Legend,
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
    """This is the main Chart class, the core of the ``Bokeh.charts`` interface.

    This class essentially set up a "universal" Plot object containing all the
    needed attributes and methods to draw any of the Charts that you can build
    subclassing the ChartObject class.
    """
    def __init__(self, title, xlabel, ylabel, legend, xscale, yscale, width, height,
                 tools, filename, server, notebook, facet = False):
        """Common arguments to be used by all the inherited classes.

        Args:
            title (str): the title of your plot.
            xlabel (str): the x-axis label of your plot.
            ylabel (str): the y-axis label of your plot.
            legend (str): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
            xscale (str): the x-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
            yscale (str): the y-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
            width (int): the width of your plot in pixels.
            height (int): the height of you plot in pixels.
            tools (bool): to enable or disable the tools in your plot.
            filename (str or bool): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
            server (str or bool): the name of your plot in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
            notebook (bool): if you want to output (or not) your plot into the
                IPython notebook.

        Attributes:
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
        self._xdr = None
        self._ydr = None
        self.facet = facet
        self._plots = []
        self.figure()
        self.categorical = False
        self.glyphs = []

    @property
    def plot(self):
        """
        Returns the currently chart plot
        """
        return self._plots[-1]

    def figure(self):
        """
        Creates a new plot as current plot.
        """
        # TODO: Should figure be validated by self.facet so we raise an exception
        # if figure is called and facet is False?
        self._plots.append(
            Plot(
                title=self.title,
                x_range=self._xdr,
                y_range=self._ydr,
                plot_width=self.plot_width,
                plot_height=self.plot_height
            )
        )

    def start_plot(self, xgrid, ygrid):
        """Add the axis, grids and tools to self.plot

        Args:
            xgrid(bool): whether to show the xgrid
            ygrid(bool): whether to shoe the ygrid
        """
        # Add axis
        xaxis = self.make_axis("below", self.xscale, self.xlabel)
        yaxis = self.make_axis("left", self.yscale, self.ylabel)

        # Add grids
        if xgrid:
            self.make_grid(0, xaxis.ticker)
        if ygrid:
            self.make_grid(1, yaxis.ticker)

        # Add tools
        if self.tools:
            for plot in self._plots:
                if not self.categorical:
                    pan = PanTool()
                    wheelzoom = WheelZoomTool()
                    reset = ResetTool()
                    plot.add_tools(pan, wheelzoom, reset)
                previewsave = PreviewSaveTool()
                plot.add_tools(previewsave)

    def add_data_plot(self, x_range, y_range):
        """Add range data to the initialized empty attributes.

        Args:
            x_range (obj): x-associated datarange object for your `self.plot`.
            y_range (obj): y-associated datarange object for your `self.plot`.
        """
        # Overwrite the ranges in the plot
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
            for i, plot in enumerate(self._plots):
                listed_glyphs = [[glyph] for glyph in self.glyphs]
                legends = list(zip(groups, listed_glyphs))
                if self.legend is True:
                    orientation = "top_right"
                else:
                    orientation = self.legend

                # When we have more then on plot we need to break legend per plot
                if len(self._plots) > 1:
                    legend = Legend(orientation=orientation, legends=[legends[i]])
                else:
                    legend = Legend(orientation=orientation, legends=legends)

                plot.add_layout(legend)

        # Add to document and session if server output is asked
        self.doc = Document()
        for plot in self._plots:
            self.doc.add(plot)

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
                ``left``, ``right``, ``above`` or ``below``.
            scale (str): the scale on the axis. It can be ``linear``, ``datetime``
                or ``categorical``.
            label (str): the label on the axis.

        Return:
            axis: Axis instance
        """
        if scale == "linear":
            axis = LinearAxis(axis_label=label)
        elif scale == "datetime":
            axis = DatetimeAxis(axis_label=label)
        elif scale == "categorical":
            axis = CategoricalAxis(major_label_orientation=np.pi / 4,
                                   axis_label=label)
            self.categorical = True

        self.plot.add_layout(axis, location)

        return axis

    def make_grid(self, dimension, ticker):
        """Create the grid just passing the axis and dimension.

        Args:
            dimension(int): the dimension of the axis, ie. xaxis=0, yaxis=1.
            ticker (obj): the axis.ticker object

        Return:
            grid: Grid instance
        """
        grid = Grid(dimension=dimension, ticker=ticker)
        self.plot.add_layout(grid)

        return grid

    def make_segment(self, source, x0, y0, x1, y1, color, width):
        """ Create a segment glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing segment refereces.
            x0 (str or list[float]) : values or field names of starting ``x`` coordinates
            y0 (str or list[float]) : values or field names of starting ``y`` coordinates
            x1 (str or list[float]) : values or field names of ending ``x`` coordinates
            y1 (str or list[float]) : values or field names of ending ``y`` coordinates
            color (str): the segment color
            width (int): the segment width

        Return:
            segment: Segment instance
        """
        segment = Segment(x0=x0, y0=y0, x1=x1, y1=y1, line_color=color, line_width=width)

        self._append_glyph(source, segment)

        return segment

    def make_line(self, source, x, y, color):
        """Create a line glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing line refereces.
            x (str or list[float]) : values or field names of line ``x`` coordinates
            y (str or list[float]) : values or field names of line ``y`` coordinates
            color (str): the line color

        Return:
            line: Line instance
        """
        line = Line(x=x, y=y, line_color=color)

        self._append_glyph(source, line)

        return line

    def make_quad(self, source, top, bottom, left, right, color, line_color):
        """Create a quad glyph and append it to the plot.renderers list.

        Args:
            source (obj): datasource object containing quad refereces.
            left (str or list[float]) : values or field names of left edges
            right (str or list[float]) : values or field names of right edges
            top (str or list[float]) : values or field names of top edges
            bottom (str or list[float]) : values or field names of bottom edges
            color (str): the fill color
            line_color (str): the line color

        Return:
            quad: Quad instance
        """
        quad = Quad(top=top, bottom=bottom, left=left, right=right,
                    fill_color=color, fill_alpha=0.7, line_color=line_color, line_alpha=1.0)

        self._append_glyph(source, quad)

        return quad

    def make_rect(self, source, x, y, width, height, color, line_color, line_width):
        """Create a rect glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            x (str or list[float]) : values or field names of center ``x`` coordinates
            y (str or list[float]) : values or field names of center ``y`` coordinates
            width (str or list[float]) : values or field names of widths
            height (str or list[float]) : values or field names of heights
            color (str): the fill color
            line_color (str): the line color
            line_width (int): the line width

        Return:
            rect: Rect instance
        """
        rect = Rect(x=x, y=y, width=width, height=height, fill_color=color,
                    fill_alpha=0.7, line_color=line_color, line_alpha=1.0, line_width=line_width)

        self._append_glyph(source, rect)

        return rect

    def make_patch(self, source, x, y, color):
        patch = Patch(
            x=x, y=y, fill_color=color, fill_alpha=0.9)

        self._append_glyph(source, patch)

    def make_scatter(self, source, x, y, markertype, color):
        """Create a marker glyph and appends it to the renderers list.

        Args:
            source (obj): datasource object containing markers refereces.
            x (str or list[float]) : values or field names of line ``x`` coordinates
            y (str or list[float]) : values or field names of line ``y`` coordinates
            markertype (int or str): Marker type to use (e.g., 2, 'circle', etc.)
            color (str): color of the points

        Return:
            scatter: Marker Glyph instance
        """

        _marker_types = OrderedDict([
            ("circle", Circle),
            ("square", Square),
            ("triangle", Triangle),
            ("diamond", Diamond),
            ("inverted_triangle", InvertedTriangle),
            ("asterisk", Asterisk),
            ("cross", Cross),
            ("x", X),
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

        self._append_glyph(source, scatter)

        return scatter

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
            print("You have a provide a filename (filename='foo.html' or"
                  " .filename('foo.html')) to save your plot.")

        if self.server:
            self.session.use_doc(self.servername)
            self.session.load_document(self.doc)
            self.session.show(self.plot)

        if self.notebook:
            from bokeh.embed import notebook_div
            for plot in self._plots:
                publish_display_data({'text/html': notebook_div(plot)})

    ## Some helper methods
    def _append_glyph(self, source, glyph):
        """ Append the glyph to the plot.renderer.

        Also add the glyph to the glyphs list.

        Args:
            source (obj): datasource containing data for the glyph
            glyph (obj): glyph type
        """
        _glyph = self.plot.add_glyph(source, glyph)

        self.glyphs.append(_glyph)
