"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the TimeSeries class which lets you build your TimeSeries charts just
passing the arguments to the Chart class and calling the proper functions.
It also add detection of the incomming input to see if it is a pandas dataframe.
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

try:
    import pandas as pd

except ImportError:
    pd = None


from ._chartobject import ChartObject, DataAdapter

from ..models import ColumnDataSource, Range1d, DataRange1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class TimeSeries(ChartObject):
    """This is the TimeSeries class and it is in charge of plotting
    TimeSeries charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.

    Examples:

        from collections import OrderedDict
        import pandas as pd

        # Here is some code to read in some stock data from the Yahoo Finance API
        AAPL = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000",
            parse_dates=['Date'])
        MSFT = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000",
            parse_dates=['Date'])
        IBM = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000",
            parse_dates=['Date'])

        xyvalues = OrderedDict(AAPL=AAPL[['Date', 'Adj Close']],
                               MSFT=MSFT[['Date', 'Adj Close']],
                               IBM=IBM[['Date', 'Adj Close']])
        df = pd.concat(xyvalues, axis=1, names=["l0", "l1"])

        from bokeh.charts import TimeSeries
        ts = TimeSeries(df, title="timeseries, pd_input", notebook=True)
        ts.legend("top_left").show()
    """
    def __init__(self, values,
                 index=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="datetime", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False):
        """
        Args:
            values (iterable 2d): a dict containing the data with names as a key
                and the data as a value.
            index (list): 1d iterable of any sort (of datetime values)
            title (str, optional): the title of your plot. Defaults to None.
            xlabel (str, optional): the x-axis label of your plot.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your plot.
                Defaults to None.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``datetime``.
            yscale (str, optional): the y-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your plot in pixels.
                Defaults to 800.
            height (int, optional): the height of you plot in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your plot.
                Defaults to True
            filename (str or bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your plot in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
                Defaults to False.
            notebook (bool, optional):if you want to output (or not) your plot into the
                IPython notebook.
                Defaults to False.

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        self.values = values
        self.source = None
        self.xdr = None
        self.ydr = None

        # list to save all the groups available in the incomming input
        self.groups = []
        self.data = dict()
        self.attr = []
        self.index = index

        super(TimeSeries, self).__init__(title, xlabel, ylabel, legend,
                                         xscale, yscale, width, height,
                                         tools, filename, server, notebook, facet)

    def get_source(self):
        """
        Push the TimeSeries data into the ColumnDataSource and calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)

        self.xdr = DataRange1d(sources=[self.source.columns(self.attr[0])])

        y_names = self.attr[1::2]

        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def draw(self):
        """Use the line glyphs to connect the xy points in the time series.

        Takes reference points from the data loaded at the ColumnDataSurce.
        """
        self.duplet = list(self._chunker(self.attr, 2))
        colors = self._set_colors(self.duplet)

        for i, duplet in enumerate(self.duplet, start=1):
            self.chart.make_line(self.source, duplet[0], duplet[1], colors[i - 1])

            if i < len(self.duplet):
                self.create_plot_if_facet()

    def prepare_data(self, values):
        if hasattr(values, 'keys'):
            if self.index is not None:
                if isinstance(self.index, string_types):
                    xs = values[self.index]

                else:
                    xs = self.index

            else:
                try:
                    xs = values.index

                except AttributeError:
                    raise

        else:
            if self.index is None:
                xs = values[0]
                values = DataAdapter(values[1:], force_alias=False)


            elif isinstance(self.index, string_types):
                raise TypeError(
                    "String indexes are only supported for DataFrame and dict inputs"
                )

            else:
                xs = self.index
                values = DataAdapter(values, force_alias=False)

        return xs, values

    def get_data(self):
        """Take the x/y data from the timeseries values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the line glyph inside the ``draw`` method.

        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []

        xs, self.values = self.prepare_data(self.values)
        for col in self.values.keys():
            if isinstance(self.index, string_types) \
                and col == self.index:
                continue

            # save every the groups available in the incomming input
            self.groups.append(col)
            self.set_and_get("x_", col, xs)
            self.set_and_get("y_", col, self.values[col])