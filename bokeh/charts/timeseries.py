"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the TimeSeries class which lets you build your TimeSeries charts just
passing the arguments to the Chart class and calling the proper functions.
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
        import datetime
        from collections import OrderedDict
        from bokeh.charts import TimeSeries

        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(5)]
        dtss = ['%s'%dt for dt in dts]
        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        ts = TimeSeries(xyvalues, index='Date', title="timeseries",
                        ylabel='Stock Prices', filename="stocks_ts.html")
        ts.legend("top_left").show()

    """
    def __init__(self, values, index=None, title=None, xlabel=None, ylabel=None,
                 legend=False, xscale="datetime", yscale="linear", width=800,
                 height=600, tools=True, filename=False, server=False,
                 notebook=False, facet=False, xgrid=True, ygrid=True):
        """
        Args:
            values (iterable): iterable 2d representing the data series
                values matrix.
            index (str|1d iterable, optional): can be used to specify a
                common custom index for all data series as follows:
                    - As a 1d iterable of any sort (of datetime values)
                        that will be used as series common index
                    - As a string that corresponds to the key of the
                        mapping to be used as index (and not as data
                        series) if area.values is a mapping (like a dict,
                        an OrderedDict or a pandas DataFrame). The values
                        must be datetime values.
            title (str, optional): the title of your chart. Defaults
                to None.
            xlabel (str, optional): the x-axis label of your chart.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your chart.
                Defaults to None.
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.
            xscale (str, optional): the x-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``datetime``.
            yscale (str, optional): the y-axis type scale of your chart.
                It can be ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your chart in pixels.
                Defaults to 800.
            height (int, optional): the height of you chart in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in
                your chart. Defaults to True
            filename (str or bool, optional): the name of the file where
                your chart. will be written. If you pass True to this
                argument, it will use ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your chart in
                the server. If you pass True to this argument, it will
                use ``untitled`` as the name in the server.
                Defaults to False.
            notebook (bool, optional): whether to output to IPython notebook
                (default: False)
            facet (bool, optional): generate multiple areas on multiple
                separate charts for each series if True. Defaults to
                False
            xgrid (bool, optional): whether to display x grid lines
                (default: True)
            ygrid (bool, optional): whether to display y grid lines
                (default: True)

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

        super(TimeSeries, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet, xgrid, ygrid
        )

    def get_data(self):
        """Take the x/y data from the timeseries values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the line glyph inside the ``draw`` method.

        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []
        xs = self.values_index
        # xs, self.values = self.prepare_data(self.values)
        for col in self.values.keys():
            if isinstance(self.index, string_types) \
                and col == self.index:
                continue

            # save every the groups available in the incomming input
            self.groups.append(col)
            self.set_and_get("x_", col, xs)
            self.set_and_get("y_", col, self.values[col])

    def get_source(self):
        """Push the TimeSeries data into the ColumnDataSource and
        calculate the proper ranges.
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

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        self.duplet = list(self._chunker(self.attr, 2))
        colors = self._set_colors(self.duplet)

        for i, (x, y) in enumerate(self.duplet, start=1):
            self.chart.make_line(self.source, x, y, colors[i - 1])

            if i < len(self.duplet):
                self.create_plot_if_facet()
