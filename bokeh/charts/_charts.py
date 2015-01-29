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

import numpy as np

from ..models import (
    CategoricalAxis, DatetimeAxis, Grid, Legend, LinearAxis, Plot)

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
    def __init__(self, title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False, xgrid=True, ygrid=True, palette=False, _doc=None,
                 _session=None, **kws):
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

        self._builders = []
        self._renderer_map = []

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

        self.check_attr()

        # create chart axis, grids and tools
        self.start_plot()

    def add_renderers(self, builder, renderers):
        self.renderers += renderers
        self._renderer_map.extend({ r._id : builder for r in renderers })

    def add_builder(self, builder):
        self._builders.append(builder)
        builder.create(self)

    def create_axes(self):
        # Add axis
        self._xaxis = self.make_axis("below", self.__xscale, self.__xlabel)
        self._yaxis = self.make_axis("left", self.__yscale, self.__ylabel)

    def create_grids(self, xgrid=True, ygrid=True):
        # Add grids
        if xgrid:
            self.make_grid(0, self._xaxis.ticker)
        if ygrid:
            self.make_grid(1, self._yaxis.ticker)

    def create_tools(self, tools):
        # only add tools if the underlying it hasn't been customized
        # by some user injection
        if not self.tools:
            # if no tools customization let's create the default tools
            if isinstance(tools, bool) and tools:
                tools = DEFAULT_TOOLS

            tool_objs = _process_tools_arg(self, tools)
            self.add_tools(*tool_objs)


    def start_plot(self):
        """Add the axis, grids and tools

        Args:
            xgrid(bool): whether to show the xgrid
            ygrid(bool): whether to shoe the ygrid
        """
        self.create_axes()
        self.create_grids(self._xgrid, self._ygrid)

        # Add tools if supposed to
        if self._enabled_tools:
            self.create_tools(self._enabled_tools)

    def add_legend(self, orientation, legends):
        """Add the legend to your plot, and the plot to a new Document.

        It also add the Document to a new Session in the case of server output.

        Args:
            groups(list): keeping track of the incoming groups of data.
                Useful to automatically setup the legend.
        """
        legend = Legend(orientation=orientation, legends=legends)
        self.add_layout(legend)

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

    # def prepare_values(self):
    #     """Prepare the input data.
    #
    #     Converts data input (self.values) to a DataAdapter and creates
    #     instance index if needed
    #     """
    #     from ._data_adapter import DataAdapter
    #     if hasattr(self, '_index'):
    #         self._values_index, self._values = DataAdapter.get_index_and_data(
    #             self._values, self._index
    #         )
    #     else:
    #         if not isinstance(self._values, DataAdapter):
    #             self._values = DataAdapter(self._values, force_alias=False)


    # def _show_teardown(self):
    #     """
    #     Convenience method that can be override by inherited classes to
    #     perform custom teardown or clean up actions after show method has
    #     build chart objects
    #     """
    #     self.end_plot()

    # def build(self):
    #     if not self._built:
    #
    #         self._setup_show()
    #         self._prepare_show()
    #         for builder in self._builders:
    #             builder.create(self)
    #
    #         self._built = True
    #
    #         self._show_teardown()

    def show(self):
        """Main show function.

        It shows the plot in file, server and notebook outputs.
        """
        # self.build()

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

    # ##################################################
    # # Some helper methods
    # ##################################################
    # def _set_and_get(self, data, prefix, attr, val, content):
    #     """Set a new attr and then get it to fill the self.data dict.
    #
    #     Keep track of the attributes created.
    #
    #     Args:
    #         data (dict): where to store the new attribute content
    #         attr (list): where to store the new attribute names
    #         val (string): name of the new attribute
    #         content (obj): content of the new attribute
    #     """
    #     _val = content
    #     # setattr(self, prefix + val, content)
    #     data[prefix + val] = _val
    #     attr.append(prefix + val)
    #
    # def set_and_get(self, prefix, val, content):
    #     """Set a new attr and then get it to fill the self.data dict.
    #
    #     Keep track of the attributes created.
    #
    #     Args:
    #         prefix (str): prefix of the new attribute
    #         val (string): name of the new attribute
    #         content (obj): content of the new attribute
    #     """
    #     self._set_and_get(self._data, prefix, self._attr, val, content)
    #
    # def _append_glyph(self, source, glyph):
    #     """ Append the glyph to the plot.renderer.
    #
    #     Also add the glyph to the glyphs list.
    #
    #     Args:
    #         source (obj): datasource containing data for the glyph
    #         glyph (obj): glyph type
    #     """
    #     _glyph = self.add_glyph(source, glyph)
    #     # print ("appended glyph", glyph, source.data)
    #     self._glyphs.append(_glyph)
    #
    # def create_plot_if_facet(self):
    #     """
    #     Generate a new plot if facet is true. This can be called after every
    #     serie is draw so the next one is draw on a new separate plot instance
    #     """
    #     if self.__facet:
    #         print("WARNING: Faceting not supported!")
    #
    # def _chunker(self, l, n):
    #     """Yield successive n-sized chunks from l.
    #
    #     Args:
    #         l (list: the incomming list to be chunked
    #         n (int): lenght of you chucks
    #     """
    #     for i in range(0, len(l), n):
    #         yield l[i:i + n]

    ##################################################
    # Methods related to method chaining
    ##################################################
    # def facet(self, facet=True):
    #     """Set the facet flag of your chart. Facet splits the chart
    #     creating a figure for every single series of the underlying data
    #
    #     Args:
    #         facet (boolean): new facet value to use for your chart.
    #
    #     Returns:
    #         self: the chart object being configured.
    #     """
    #     self._facet = facet
    #     return self


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
        if not hasattr(self, '_xgrid'):
            self._xgrid = self.__xgrid
        if not hasattr(self, '_ygrid'):
            self._ygrid = self.__ygrid
