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

from ._charts import Chart
from bokeh.properties import bokeh_integer_types

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
    def __init__(self, title, xlabel, ylabel, legend,
                 xscale, yscale, width, height,
                 tools, filename, server, notebook, facet=False):
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
        self.facet = facet

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

    def start_plot(self, xgrid=True, ygrid=True):
        """Wrapper to call the ``chart.start_plot`` method.

        Args:
            xgrid(bool, optional): whether to show the xgrid
            ygrid(bool, optional): whether to shoe the ygrid
        """
        self.chart.start_plot(xgrid, ygrid)

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

    def add_data_plot(self, xdr, ydr):
        """Wrapper to call the ``chart.add_data_plot`` method.

        It pass ranges as parameters of the ``chart.add_data_plot`` method.

        Args:
            xdr (obj): x-associated datarange object for you plot.
            ydr (obj): y-associated datarange object for you plot.
        """
        self.chart.add_data_plot(xdr, ydr)

    def draw(self):
        """Draw the glyphs into the plot.

        It has to be implemented by any of the inherited class
        representing each different chart type.
        """
        pass

    def end_plot(self, groups):
        """Wrapper to call the ``chart.end_plot`` method.

        It pass groups as parameters of the `chart.end_plot` method.

        Args:
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
        """
        self.chart.end_plot(groups)

    def show_chart(self):
        "Wrapper to call the ``chart.show`` method."
        self.chart.show()

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

    def create_plot_if_facet(self):
        """
        Generate a new plot if facet is true. This can be called after every
        serie is draw so the next one is draw on a new separate plot instance
        """
        if self.facet:
            self.chart.figure()

            # we start the plot (adds axis, grids and tools)
            self.start_plot()
            self.add_data_plot(self.xdr, self.ydr)

DEFAULT_INDEX_ALIASES = list('abcdefghijklmnopqrstuvz1234567890')
DEFAULT_INDEX_ALIASES += zip(DEFAULT_INDEX_ALIASES, DEFAULT_INDEX_ALIASES)

class DataAdapter(object):
    """
    Adapter object used to normalize Charts inputs to a common know interface
    """
    def __init__(self, data, index=None, columns=None, force_alias=True):
        self._values = self.validate_values(data)

        self.convert_index_to_int = False
        self._columns_map = {}

        if columns is None and force_alias:
            # no column 'labels' defined for data... in this case we use
            # default names
            keys = getattr(self._values, 'keys', None)
            if callable(keys):
                columns = list(keys())

            elif keys is None:
                columns = map(str, range(len(data)))

            else:
                columns = list(keys)

        if columns:
            self._columns = columns

            # define a mapping between the real keys to access data and the aliases
            # we have defined using 'columns'
            self._columns_map = dict(zip(columns, self.keys()))

        if index is not None:
            self._index = index

        elif force_alias:
            _index = getattr(self._values, 'index', None)

            # check because if it is a callable self._values is not a
            # dataframe (probably a list)
            if _index is None:
                indexes = self.index

                if isinstance(indexes[0], int):
                    self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]

            elif not callable(_index):
                self._index = list(_index)

            else:
                self._index = DEFAULT_INDEX_ALIASES[:][:len(self.values()[0])]

    @staticmethod
    def validate_values(values):
        numbers = (float, ) + bokeh_integer_types

        if np and isinstance(values, np.ndarray):
            return values

        elif pd and isinstance(values, pd.DataFrame):
            return values

        elif isinstance(values, dict):
            if all(isinstance(x, numbers) for x in values.values()):
                return values

            return values

        elif isinstance(values, (list, tuple)):
            if all(isinstance(x, numbers) for x in values):
                return [values]

            return values

        # TODO: Improve this error message..
        raise TypeError("Input type not supported!")


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
            return map(str, indexes)

        else:
            return list(keys)


    def __len__(self):
        return len(self._values)

    def __iter__(self):
        for k in self.keys():
            yield k

    def __getitem__(self, key):
        val = self._values[self.index_converter(key)]

        # if we have "index aliases" we need to remap the values...
        # TODO: this should be more explicit... we shouldn't rely on an implementation
        # details to do something that is very subtle like remapping keys...
        if hasattr(self, "_index"):
            val = dict(zip(self._index, val))

        return val

    def values(self):
        values = getattr(self._values, "values", None)

        if callable(values):
            return values()

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
            return values.keys()

        else:
            first_el = self.values()[0]

            if isinstance(first_el, dict):
                indexes = first_el.keys()

            else:
                indexes = range(0, len(self.values()[0]))
                self._index = indexes
            return indexes
