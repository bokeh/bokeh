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
import warnings
from collections import OrderedDict
from six import string_types
import re
import numpy as np

from ..models.glyphs import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond,
                             DiamondCross, InvertedTriangle, Line, Rect, Segment,
                             Square, SquareCross, SquareX, Triangle, X, Quad, Patch,
                             Wedge, AnnularWedge, Text)
from ..models import (CategoricalAxis, DatetimeAxis, Grid, Legend,
                       LinearAxis, PanTool, Plot, PreviewSaveTool, ResetTool,
                       WheelZoomTool)

from ..document import Document
from ..session import Session
from ..embed import file_html
from ..resources import INLINE
from ..browserlib import view
from ..utils import publish_display_data
from ..plotting_helpers import _process_tools_arg
from ..plotting import DEFAULT_TOOLS

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
                 tools, filename, server, notebook, facet = False, doc=None,
                 session=None):
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
            tools (seq[Tool or str]|str|bool): list of tool types or
                string listing the tool names.
                I.e.: `wheel_zoom,box_zoom,reset`. If a bool value
                is specified:
                    - `True` enables defaults tools
                    - `False` disables all tools
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
        self.categorical = False
        self.glyphs = []

        # Add to document and session if server output is asked
        if doc:
            self.doc = doc
            if not self.doc._current_plot:
                self.figure()
            else:
                self._plots = [self.doc._current_plot]
        else:
            self.figure()
            self.doc = Document()

        if self.server:
            if session:
                self.session = session
            else:
                self.session = Session()

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
        if not self.doc._current_plot:
            # Add axis
            xaxis = self.make_axis("below", self.xscale, self.xlabel)
            yaxis = self.make_axis("left", self.yscale, self.ylabel)

            # Add grids
            if xgrid:
                self.make_grid(0, xaxis.ticker)
            if ygrid:
                self.make_grid(1, yaxis.ticker)

            # Add tools if supposed to
            if self.tools:
                # need to add tool to all underlying plots
                for plot in self._plots:
                    # only add tools if the underlying plot hasn't been customized
                    # by some user injection
                    if not plot.tools:
                        # if True let's create the default tools
                        if isinstance(self.tools, bool) and self.tools:
                            self.tools = DEFAULT_TOOLS

                        tool_objs = _process_tools_arg(plot, self.tools)
                        plot.add_tools(*tool_objs)

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
                if plot not in self.doc.context.children:
                    listed_glyphs = [[glyph] for glyph in self.glyphs]
                    legends = list(zip(groups, listed_glyphs))
                    if self.legend is True:
                        orientation = "top_right"
                    else:
                        orientation = self.legend

                    legend = None
                    # When we have more then on plot we need to break legend per plot
                    if len(self._plots) > 1:
                        try:
                            legend = Legend(orientation=orientation, legends=[legends[i]])

                        except IndexError:
                            pass
                    else:
                        legend = Legend(orientation=orientation, legends=legends)

                    if legend is not None:
                        plot.add_layout(legend)

        if self.server:
            if self.server is True:
                self.servername = "untitled_chart"
            else:
                self.servername = self.server

            self.session.use_doc(self.servername)
            self.session.load_document(self.doc)

        for plot in self._plots:
            if plot not in self.doc.context.children:
                self.doc._current_plot = plot
                self.doc.add(plot)

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
        """Create a patch glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            x (str or list[float]) : values or field names of center ``x`` coordinates
            y (str or list[float]) : values or field names of center ``y`` coordinates
            color (str): the fill color

        Return:
            patch: Patch instance
        """
        patch = Patch(
            x=x, y=y, fill_color=color, fill_alpha=0.9)

        self._append_glyph(source, patch)
        return patch

    def make_wedge(self, source, **kws):
        """Create a wedge glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect references.
            **kws (refer to glyphs.Wedge for arguments specification details)

        Return:
            glyph: Wedge instance
        """
        glyph = Wedge(**kws)
        self._append_glyph(source, glyph)
        return glyph

    def make_annular(self, source, **kws):
        """Create a annular wedge glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect refereces.
            **kws (refer to glyphs.AnnularWedge for arguments specification details)

        Return:
            rect: AnnularWedge instance
        """
        glyph = AnnularWedge(**kws)
        self._append_glyph(source, glyph)
        return glyph

    def make_text(self, source, **kws):
        """Create a text glyph and append it to the renderers list.

        Args:
            source (obj): datasource object containing rect references.
            **kws (refer to glyphs.Text for arguments specification details)

        Return:
            glyph: Text instance
        """
        glyph = Text(**kws)
        self._append_glyph(source, glyph)
        return glyph

    def make_scatter(self, source, x, y, markertype, color, line_color=None,
                     size=10, fill_alpha=0.2, line_alpha=1.0):
        """Create a marker glyph and appends it to the renderers list.

        Args:
            source (obj): datasource object containing markers references.
            x (str or list[float]) : values or field names of line ``x`` coordinates
            y (str or list[float]) : values or field names of line ``y`` coordinates
            markertype (int or str): Marker type to use (e.g., 2, 'circle', etc.)
            color (str): color of the points
            size (int) : size of the scatter marker
            fill_alpha(float) : alpha value of the fill color
            line_alpha(float) : alpha value of the line color

        Return:
            scatter: Marker Glyph instance
        """
        if line_color is None:
            line_color = color

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
        scatter = _marker_types[shape](x=x, y=y, size=size,
                                       fill_color=color,
                                       fill_alpha=fill_alpha,
                                       line_color=line_color,
                                       line_alpha=line_alpha)

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
            print("You have to provide a filename (filename='foo.html' or"
                  " .filename('foo.html')) to save your plot.")

        if self.server:
            self.session.store_document(self.doc)
            link = self.session.object_link(self.doc.context)
            if not self.notebook:
                view(link)

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
