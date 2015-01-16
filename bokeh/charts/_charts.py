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


class Chart(Plot):
    """This is the main Chart class, the core of the ``Bokeh.charts`` interface.

    This class essentially set up a "universal" Plot object containing all the
    needed attributes and methods to draw any of the Charts that you can build
    subclassing the ChartObject class.
    """

    __subtype__ = "Chart"
    __view_model__ = "Plot"
    def __init__(self, title, xlabel, ylabel, legend, xscale, yscale, width, height,
                 tools, filename, server, notebook, facet=False, xgrid=True,
                 ygrid=True, palette=False, _doc=None, _session=None):
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
        kw = dict(title=title, plot_width=width, plot_height=height)

        self._source = None
        # list to save all the groups available in the incomming input
        self._groups = []
        self._data = dict()
        self._attr = []

        super(Chart, self).__init__(**kw)

        self.__title = title
        self.__xlabel = xlabel
        self.__ylabel = ylabel
        self.__legend = legend
        self.__xscale = xscale
        self.__yscale = yscale
        self.__width = width
        self.__height = height
        self.__enabled_tools = tools
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook
        self.__facet = facet
        self.__palette = palette
        self.__xgrid = xgrid
        self.__ygrid = ygrid

        self._glyphs = []
        self._built = False

        # Add to document and session if server output is asked
        if _doc:
            self._doc = _doc
        else:
            self._doc = Document()

        if self.__server:
            if _session:
                self._session = _session
            else:
                self._session = Session()

    def start_plot(self): #, xgrid, ygrid):
        """Add the axis, grids and tools

        Args:
            xgrid(bool): whether to show the xgrid
            ygrid(bool): whether to shoe the ygrid
        """
        # Add axis
        xaxis = self.make_axis("below", self.__xscale, self.__xlabel)
        yaxis = self.make_axis("left", self.__yscale, self.__ylabel)

        # Add grids
        if self._xgrid:
            self.make_grid(0, xaxis.ticker)
        if self._ygrid:
            self.make_grid(1, yaxis.ticker)

        # Add tools if supposed to
        if self._enabled_tools:
            # only add tools if the underlying it hasn't been customized
            # by some user injection
            if not self.tools:
                tools_conf = self._enabled_tools
                # if no tools customization let's create the default tools
                if isinstance(tools_conf, bool) and tools_conf:
                    tools_conf = DEFAULT_TOOLS

                tool_objs = _process_tools_arg(self, tools_conf)
                self.add_tools(*tool_objs)

    def _set_colors(self, chunk):
        """Build a color list just cycling through a defined palette.

        Args:
            chuck (list): the chunk of elements to generate the color list.
        """
        colors = []

        pal = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]
        g = itertools.cycle(pal)
        for i in range(len(chunk)):
            colors.append(next(g))

        return colors

    def end_plot(self):
        """Add the legend to your plot, and the plot to a new Document.

        It also add the Document to a new Session in the case of server output.

        Args:
            groups(list): keeping track of the incoming groups of data.
                Useful to automatically setup the legend.
        """
        # Add legend
        if self.__legend:
            for i, plot in enumerate([self]): #self._plots):
                listed_glyphs = [[glyph] for glyph in self._glyphs]
                legends = list(zip(self._groups, listed_glyphs))
                if self.__legend is True:
                    orientation = "top_right"
                else:
                    orientation = self.__legend

                legend = None
                # When we have more then on plot we need to break legend per plot
                legend = Legend(orientation=orientation, legends=legends)
                plot.add_layout(legend)

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
            axis = CategoricalAxis(
                major_label_orientation=np.pi / 4, axis_label=label
            )

        self.add_layout(axis, location)
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
        self.add_layout(grid)

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
        segment = Segment(
            x0=x0, y0=y0, x1=x1, y1=y1, line_color=color, line_width=width
        )

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
        quad = Quad(
            top=top, bottom=bottom, left=left, right=right, fill_color=color,
            fill_alpha=0.7, line_color=line_color, line_alpha=1.0
        )

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
        rect = Rect(
            x=x, y=y, width=width, height=height, fill_color=color,
            fill_alpha=0.7, line_color=line_color, line_alpha=1.0,
            line_width=line_width
        )
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
        patch = Patch(x=x, y=y, fill_color=color, fill_alpha=0.9)
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

        _marker_types = OrderedDict(
            [
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
            ]
        )

        g = itertools.cycle(_marker_types.keys())
        if isinstance(markertype, int):
            for i in range(markertype):
                shape = next(g)
        else:
            shape = markertype
        scatter = _marker_types[shape](
            x=x, y=y, size=size, fill_color=color, fill_alpha=fill_alpha,
            line_color=line_color, line_alpha=line_alpha
        )

        self._append_glyph(source, scatter)

        return scatter

    def _prepare_show(self):
        """
        Executes chart show core operations:

         - checks for chain methods
         - prepare chart data & source
         - create indexes
         - create glyphs
         - draw glyphs
        """
        # prepare values
        self.prepare_values()
        # get the data from the incoming input
        self.get_data()
        # filled the source and ranges with the calculated data
        self.get_source()
        # we dynamically inject the source and ranges into the plot
        # self.add_data_plot()
        # we start the plot (adds axis, grids and tools)
        self.start_plot()
        # we add the glyphs into the plot
        self.draw()
        # we pass info to build the legend
        self.end_plot()

    def prepare_values(self):
        """Prepare the input data.

        Converts data input (self.values) to a DataAdapter and creates
        instance index if needed
        """
        from ._chartobject import DataAdapter
        if hasattr(self, '_index'):
            self._values_index, self._values = DataAdapter.get_index_and_data(
                self._values, self._index
            )
        else:
            if not isinstance(self._values, DataAdapter):
                self._values = DataAdapter(self._values, force_alias=False)

    def get_data(self):
        """Get the input data.

        It has to be implemented by any of the inherited class
        representing each different chart type. It is the place
        where we make specific calculations for each chart.
        """
        pass

    def get_source(self):
        """Push data into the ColumnDataSource and build the proper ranges.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def _setup_show(self):
        """Prepare context before main show method is invoked """
        # we need to check the chained method attr
        self.check_attr()

    def _show_teardown(self):
        """
        Convenience method that can be override by inherited classes to
        perform custom teardown or clean up actions after show method has
        build chart objects
        """
        pass

    def build(self):
        if not self._built:
            self._setup_show()
            self._prepare_show()
            self._show_teardown()
            self._built = True

    def show(self):
        """Main show function.

        It shows the plot in file, server and notebook outputs.
        """
        self.build()

        # Add to document and session
        if self._server:
            if self._server is True:
                self._servername = "untitled_chart"
            else:
                self._servername = self.__server

            self._session.use_doc(self._servername)
            self._session.load_document(self._doc)

        if not self._doc._current_plot == self:
            self._doc._current_plot = self
            self._doc.add(self)

        if self._filename:
            if self._filename is True:
                filename = "untitled"
            else:
                filename = self._filename
            with open(filename, "w") as f:
                f.write(file_html(self._doc, INLINE, self.title))
            print("Wrote %s" % filename)
            view(filename)
        elif self.__filename is False and \
                        self.__server is False and \
                        self.__notebook is False:
            print("You have a provide a filename (filename='foo.html' or"
                  " .filename('foo.html')) to save your plot.")

        if self.__server:
            self.session.store_document(self._doc)
            link = self._session.object_link(self._doc.context)
            view(link)

        if self.__notebook:
            from bokeh.embed import notebook_div
            # for plot in self._plots:
            publish_display_data({'text/html': notebook_div(self)})

    ##################################################
    # Some helper methods
    ##################################################
    def _set_and_get(self, data, prefix, attr, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            data (dict): where to store the new attribute content
            attr (list): where to store the new attribute names
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        _val = content
        # setattr(self, prefix + val, content)
        data[prefix + val] = _val
        attr.append(prefix + val)

    def set_and_get(self, prefix, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            prefix (str): prefix of the new attribute
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        self._set_and_get(self._data, prefix, self._attr, val, content)

    def _append_glyph(self, source, glyph):
        """ Append the glyph to the plot.renderer.

        Also add the glyph to the glyphs list.

        Args:
            source (obj): datasource containing data for the glyph
            glyph (obj): glyph type
        """
        _glyph = self.add_glyph(source, glyph)
        self._glyphs.append(_glyph)

    def create_plot_if_facet(self):
        """
        Generate a new plot if facet is true. This can be called after every
        serie is draw so the next one is draw on a new separate plot instance
        """
        if self.__facet:
            print("WARNING: Faceting not supported!")


    ##################################################
    # Methods related to method chaining
    ##################################################
    def facet(self, facet=True):
        """Set the facet flag of your chart. Facet splits the chart
        creating a figure for every single series of the underlying data

        Args:
            facet (boolean): new facet value to use for your chart.

        Returns:
            self: the chart object being configured.
        """
        self._facet = facet
        return self


    def xlabel(self, xlabel):
        """Set the xlabel of your chart.

        Args:
            xlabel (str): the x-axis label of your plot.

        Returns:
            self: the chart object being configured.
        """
        self._xlabel = xlabel
        return self

    def ylabel(self, ylabel):
        """Set the ylabel of your chart.

        Args:
            ylabel (str): the y-axis label of your plot.

        Returns:
            self: the chart object being configured.
        """
        self._ylabel = ylabel
        return self

    def xgrid(self, xgrid):
        """Set the xgrid of your chart.

        Args:
            xgrid (bool): defines if x-grid of your plot is visible or not

        Returns:
            self: the chart object being configured.
        """
        self._xgrid = xgrid
        return self

    def ygrid(self, ygrid):
        """Set the ygrid of your chart.

        Args:
            ygrid (bool): defines if y-grid of your plot is visible or not

        Returns:
            self: the chart object being configured.
        """
        self._ygrid = ygrid
        return self

    def legend(self, legend):
        """Set the legend of your chart.

        The legend content is inferred from incoming input.
        It can be ``top_left``, ``top_right``, ``bottom_left``, ``bottom_right``.
        It is ``top_right`` is you set it as True.

        Args:
            legend (str or bool): the legend of your plot.

        Returns:
            self: the chart object being configured.
        """
        self._legend = legend
        return self

    def xscale(self, xscale):
        """Set the xscale of your chart.

        It can be ``linear``, ``datetime`` or ``categorical``.

        Args:
            xscale (str): the x-axis scale of your plot.

        Returns:
            self: the chart object being configured.
        """
        self._xscale = xscale
        return self

    def yscale(self, yscale):
        """Set the yscale of your chart.

        It can be ``linear``, ``datetime`` or ``categorical``.

        Args:
            yscale (str): the y-axis scale of your plot.

        Returns:
            self: the chart object being configured.
        """
        self._yscale = yscale
        return self

    def width(self, width):
        """Set the width of your chart.

        Args:
            width (int): the width of your plot in pixels.

        Returns:
            self: the chart object being configured.
        """
        self._width = width
        return self

    def height(self, height):
        """Set the height of your chart.

        Args:
            height (int): the height of you plot in pixels.

        Returns:
            self: the chart object being configured.
        """
        self._height = height
        return self


    def filename(self, filename):
        """Set the file name of your chart.

        If you pass True to this argument, it will use ``untitled`` as a filename.

        Args:
            filename (str or bool): the file name where your plot will be written.

        Returns:
            self: the chart object being configured.
        """
        self._filename = filename
        return self

    def server(self, server):
        """Set the server name of your chart.

        If you pass True to this argument, it will use ``untitled``
        as the name in the server.

        Args:
            server (str or bool): the name of your plot in the server

        Returns:
            self: the chart object being configured.
        """
        self._server = server
        return self

    def notebook(self, notebook=True):
        """Show your chart inside the IPython notebook.

        Args:
            notebook (bool, optional) : whether to output to the
                IPython notebook (default: True).

        Returns:
            self: the chart object being configured.
        """
        self._notebook = notebook
        return self

    def check_attr(self):
        """Check if any of the underscored attributes exists.

        It checks if any of the chained method were used. If they were
        not used, it assigns the parameters content by default.
        """
        if not hasattr(self, '_title'):
            self._title = self.__title
        if not hasattr(self, '_xlabel'):
            self._xlabel = self.__xlabel
        if not hasattr(self, '_ylabel'):
            self._ylabel = self.__ylabel
        if not hasattr(self, '_legend'):
            self._legend = self.__legend
        if not hasattr(self, '_xscale'):
            self._xscale = self.__xscale
        if not hasattr(self, '_yscale'):
            self._yscale = self.__yscale
        if not hasattr(self, '_width'):
            self._width = self.__width
        if not hasattr(self, '_height'):
            self._height = self.__height
        if not hasattr(self, '_enabled_tools'):
            self._enabled_tools = self.__enabled_tools
        if not hasattr(self, '_filename'):
            self._filename = self.__filename
        if not hasattr(self, '_server'):
            self._server = self.__server
        if not hasattr(self, '_notebook'):
            self._notebook = self.__notebook
        if not hasattr(self, '_facet'):
            self._facet = self.__facet
        if not hasattr(self, '_palette'):
            self._palette = self.__palette
        if not hasattr(self, '_xgrid'):
            self._xgrid = self.__xgrid
        if not hasattr(self, '_ygrid'):
            self._ygrid = self.__ygrid


class OldChart(object):
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
