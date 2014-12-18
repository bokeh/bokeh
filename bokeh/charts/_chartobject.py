"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the ChartObject class, a minimal prototype class to build more chart
types on top of it. It provides the mechanisms to support the shared chained
methods.
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

from six import string_types
from collections import OrderedDict
from ._charts import Chart
from ..properties import bokeh_integer_types, Datetime
from ..models import ColumnDataSource

try:
    import numpy as np

except ImportError:
    np = None

try:
    import pandas as pd

except ImportError:
    pd = None

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class ChartObject(object):
    """A prototype class to inherit each new chart type.

    It provides useful methods to be used by the inherited chart classes,
    such as:
        * chained methods
        * dynamically chart cration attributes, ie. `self.chart`
        * composition to easily use Chart clase methods
    """

    # whether to show the xgrid
    xgrid = True

    # whether to show the ygrid
    ygrid = True

    def __init__(self, title, xlabel, ylabel, legend,
                 xscale, yscale, width, height,
                 tools, filename, server, notebook, facet=False, palette=None):
        """Common arguments to be used by all the inherited classes.

        Args:
            title (str): the title of your plot.
            xlabel (str): the x-axis label of your plot.
            ylabel (str): the y-axis label of your plot.
            legend (str, bool): the legend of your plot. The legend content is
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
            notebook (bool):if you want to output (or not) your plot into the
                IPython notebook.

        .. note::
            These Args are assigned to private attributes that will be used
            by default at the time of chart instantiation, except in the case
            we call any of the chained methods available, in that case the
            value used with the chained method will overwrite the default one.
        """
        self.__title = title
        self.__xlabel = xlabel
        self.__ylabel = ylabel
        self.__legend = legend
        self.__xscale = xscale
        self.__yscale = yscale
        self.__width = width
        self.__height = height
        self.__tools = tools
        self.__filename = filename
        self.__server = server
        self.__notebook = notebook
        self.__facet = facet
        self.__palette = palette

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

    def title(self, title):
        """Set the title of your chart.

        Args:
            title (str): new title to use for your chart.

        Returns:
            self: the chart object being configured.
        """
        self._title = title
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

    def tools(self, tools=True):
        """Set the tools of your chart.

        Args:
            tools (bool, optional): to enable or disable the tools
                in your plot (default: True).

        Returns:
            self: the chart object being configured.
        """
        self._tools = tools
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

    # TODO: make more chain methods

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
        if not hasattr(self, '_tools'):
            self._tools = self.__tools
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

    def create_chart(self):
        """Dynamically create a new chart object.

        It creates a chart instance customized with the parameters
        we have passed at the __init__ step or through the chained
        methods.

        Returns:
            chart: the chart object being configured.
        """
        chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self._xscale, self._yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)

        self.chart = chart

        return chart

    def start_plot(self):
        """
        Wrapper to call the ``chart.start_plot`` method with self.xgrid &
        self.ygrid
        """
        self.chart.start_plot(self.xgrid, self.ygrid)

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

    def add_data_plot(self):
        """
        Wrapper to call the ``chart.add_data_plot`` method.

        It pass self.xdr and self.ydr ranges as parameters of the
        ``chart.add_data_plot`` method, where those values should be:

            self.xdr (obj): x-associated datarange object for you plot.
            self.ydr (obj): y-associated datarange object for you plot.
        """
        self.chart.add_data_plot(self.xdr, self.ydr)

    def draw(self):
        """Draw the glyphs into the plot.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def end_plot(self):
        """Wrapper to call the ``chart.end_plot`` method.

        It pass groups as parameters of the `chart.end_plot` method.

        Args:
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
        """
        self.chart.end_plot(self.groups)

    def show_chart(self):
        "Wrapper to call the ``chart.show`` method."
        self.chart.show()

    def show(self):
        """Main Chart show method.

        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        .. note:: the show method can not be chained. It has to be called
        at the end of the chain.
        """
        self._setup_show()
        self._prepare_show()
        self._show_teardown()

        # and finally we show it
        self.show_chart()

    def _setup_show(self):
        """Prepare context before main show method is invoked """
        # we need to check the chained method attr
        self.check_attr()

    def _prepare_show(self):
        """
        Executes chart show core operations:

         - checks for chain methods
         - prepare chart data & source
         - create indexes
         - create glyphs
         - draw glyphs
        """

        # we create the chart object
        self.create_chart()
        # we start the plot (adds axis, grids and tools)
        self.start_plot()
        # we get the data from the incoming input
        self.get_data()
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we dynamically inject the source and ranges into the plot
        self.add_data_plot()
        # we add the glyphs into the plot
        self.draw()
        # we pass info to build the legend
        self.end_plot()

    def _show_teardown(self):
        """
        Convenience method that can be override by inherited classes to
        perform custom teardown or clean up actions after show method has
        build chart objects
        """
        pass

    def create_plot_if_facet(self):
        """
        Generate a new plot if facet is true. This can be called after every
        serie is draw so the next one is draw on a new separate plot instance
        """
        if self._facet:
            self.chart.figure()

            # we start the plot (adds axis, grids and tools)
            self.start_plot()
            self.add_data_plot()

    #
    # Some helper methods
    def _chunker(self, l, n):
        """Yield successive n-sized chunks from l.

        Args:
            l (list: the incomming list to be chunked
            n (int): lenght of you chucks
        """
        for i in range(0, len(l), n):
            yield l[i:i + n]

    def _set_colors(self, chunk):
        """Build a color list just cycling through a defined palette.

        Args:
            chuck (list): the chunk of elements to generate the color list.
        """
        colors = []

        pal = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]
        import itertools
        g = itertools.cycle(pal)
        for i in range(len(chunk)):
            colors.append(next(g))

        return colors

    def _set_and_get(self, data, prefix, attr, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            data (dict): where to store the new attribute content
            attr (list): where to store the new attribute names
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        setattr(self, prefix + val, content)
        data[prefix + val] = getattr(self, prefix + val)
        attr.append(prefix + val)

    def set_and_get(self, prefix, val, content):
        """Set a new attr and then get it to fill the self.data dict.

        Keep track of the attributes created.

        Args:
            prefix (str): prefix of the new attribute
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        self._set_and_get(self.data, prefix, self.attr, val, content)

    @property
    def palette(self):
        """Build a color list just cycling through a defined palette.

        """
        if not self._palette:
            self._palette = self._set_colors(self.groups)

        return self._palette

    def reset_legend(self, marker='square'):
        """Reset legends creating the right glyphs to represent each chart series.

        Charts that use a composition of multiple underlying glyphs to represent
        the data series need to create `dummy` glyphs to be used only to draw the
        correct glyph to each series. This is done directly modifying chart.glyphs

        """
        # create a data source that maps the chart.groups
        source_legend = ColumnDataSource({"groups": self.groups})

        # We need to build the legend here using dummy glyphs
        indexes = []
        real_glyphs_count = len(self.chart.glyphs)

        for i, level in enumerate(self.groups):
            self._make_legend_glyph(source_legend, self.palette[i])

            # need to manually select the proper glyphs to be rendered as legends
            indexes.append(real_glyphs_count+i)

        # reset glyphs tho only contain the dummy
        self.chart.glyphs = [self.chart.glyphs[i] for i in indexes]

    def _make_legend_glyph(self, source_legend, color):
        """Create a new glyph to represent one of the chart data series with the
        specified color

        The glyph is added to chart.glyphs.

        Args:
            source_legend (ColumnDataSource): source to be used when creating the glyph
            color (str): color of the glyph
        """
        self.chart.make_rect(source_legend, "groups", None, None, None,
                                 color, "black", None)

DEFAULT_INDEX_ALIASES = list('abcdefghijklmnopqrstuvz1234567890')
DEFAULT_INDEX_ALIASES += list(zip(DEFAULT_INDEX_ALIASES, DEFAULT_INDEX_ALIASES))

class DataAdapter(object):
    """
    Adapter object used to normalize Charts inputs to a common interface.
    Supported inputs are dict, list, tuple, np.ndarray and pd.DataFrame.
    """
    def __init__(self, data, index=None, columns=None, force_alias=True):
        self._values = self.validate_values(data)

        self.convert_index_to_int = False
        self._columns_map = {}
        self.convert_items_to_dict = False

        if columns is None and force_alias:
            # no column 'labels' defined for data... in this case we use
            # default names
            keys = getattr(self._values, 'keys', None)
            if callable(keys):
                columns = list(keys())

            elif keys is None:
                columns = list(map(str, range(len(data))))

            else:
                columns = list(keys)

        if columns:
            self._columns = columns

            # define a mapping between the real keys to access data and the aliases
            # we have defined using 'columns'
            self._columns_map = dict(zip(columns, self.keys()))

        if index is not None:
            self._index = index
            self.convert_items_to_dict = True

        elif force_alias:
            _index = getattr(self._values, 'index', None)

            # check because if it is a callable self._values is not a
            # dataframe (probably a list)
            if _index is None:
                indexes = self.index

                if isinstance(indexes[0], int):
                    self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                    self.convert_items_to_dict = True

            elif not callable(_index):
                self._index = list(_index)
                self.convert_items_to_dict = True

            else:
                self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]
                self.convert_items_to_dict = True

    @staticmethod
    def is_number(value):
        numbers = (float, ) + bokeh_integer_types
        return isinstance(value, numbers)

    @staticmethod
    def is_datetime(value):
        try:
            dt = Datetime(value)
            return True

        except ValueError:
            return False

    @staticmethod
    def validate_values(values):
        if np and isinstance(values, np.ndarray):
            if len(values.shape) == 1:
                return np.array([values])

            else:
                return values

        elif pd and isinstance(values, pd.DataFrame):
            return values

        elif isinstance(values, (dict, OrderedDict)):
            if all(DataAdapter.is_number(x) for x in values.values()):
                return values

            return values

        elif isinstance(values, (list, tuple)):
            if all(DataAdapter.is_number(x) for x in values):
                return [values]

            return values

        # TODO: Improve this error message..
        raise TypeError("Input type not supported! %s" % values)


    def index_converter(self, x):
        key = self._columns_map.get(x, x)
        if self.convert_index_to_int:
            key = int(key)
        return key

    def keys(self):
        # assuming it's a dict or dataframe
        keys = getattr(self._values, "keys", None)

        if callable(keys):
            return list(keys())

        elif keys is None:
            # assuming that only non-dict like objects can raise this error
            # it's probably because we have an iterable instead of a mapper
            # in this case let's use indices as groups keys
            self.convert_index_to_int = True
            indexes = range(len(self._values))
            return list(map(str, indexes))

        else:
            return list(keys)

    def __len__(self):
        return len(self.values())

    def __iter__(self):
        for k in self.keys():
            yield k

    def __getitem__(self, key):
        val = self._values[self.index_converter(key)]

        # if we have "index aliases" we need to remap the values...
        if self.convert_items_to_dict:
            val = dict(zip(self._index, val))

        return val

    def values(self):
        values = getattr(self._values, "values", None)

        if callable(values):
            return list(values())

        elif values is None:
            return self._values

        else:
            return list(self._values)

    def items(self):
        return [(key, self[key]) for key in self]

    def iterkeys(self):
        return iter(self)

    def itervalues(self):
        for k in self:
            yield self[k]

    def iteritems(self):
        for k in self:
            yield (k, self[k])

    @property
    def columns(self):
        try:
            return self._columns

        except AttributeError:
            return list(self.keys())

    @property
    def index(self):
        try:
            return self._index

        except AttributeError:
            index = getattr(self._values, "index", None)

            if not callable(index) and index is not None:
                # guess it's a pandas dataframe..
                return index

        # no, it's not. So it's probably a list so let's get the
        # values and check
        values = self.values()

        if isinstance(values, dict):
            return list(values.keys())

        else:
            first_el = self.values()[0]

            if isinstance(first_el, dict):
                indexes = list(first_el.keys())

            else:
                indexes = range(0, len(self.values()[0]))
                self._index = indexes
            return indexes

    #-----------------------------------------------------------------------------
    # Convenience methods
    #-----------------------------------------------------------------------------
    @staticmethod
    def get_index_and_data(values, index=None):
        """Parse values (that must be one of the DataAdapter supported
        input types) and create an separate/create index and data
        depending on values type and index.

        Args:
            values (iterable): container that holds data to be plotted using
                on the Chart classes

        Returns:
            xs: iterable that represents the data index
            values: iterable containing the values to be plotted
        """
        if hasattr(values, 'keys'):
            if index is not None:
                if isinstance(index, string_types):
                    xs = values[index]

                else:
                    xs = index

            else:
                try:
                    xs = values.index

                except AttributeError:
                    values = DataAdapter(values, force_alias=False)
                    xs = values.index

        else:
            if index is None:
                values = DataAdapter(values, force_alias=False)
                xs = values.index

            elif isinstance(index, string_types):
                msg = "String indexes are only supported for DataFrame and dict inputs"
                raise TypeError(msg)

            else:
                xs = index
                values = DataAdapter(values, force_alias=False)

        return xs, values
