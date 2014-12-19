"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Scatter class which lets you build your Scatter charts
just passing the arguments to the Chart class and calling the proper
functions.
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

try:
    import pandas as pd
except:
    pd = None

from collections import OrderedDict
from ._chartobject import ChartObject, DataAdapter
from ..models import ColumnDataSource, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Scatter(ChartObject):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    Example:
        from collections import OrderedDict

        from bokeh.charts import Scatter
        xyvalues = OrderedDict()
        xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
        xyvalues['pypy'] = [(1, 12), (2, 23), (4, 47), (5, 15), (8, 46)]
        xyvalues['jython'] = [(1, 22), (2, 43), (4, 10), (6, 25), (8, 26)]

        scatter = Scatter(xyvalues, filename="scatter.html")
        scatter.title("Languages Scatter").legend("top_left")
        scatter.width(600).height(400).show()
    """
    def __init__(self, values, title=None, xlabel=None, ylabel=None,
                 legend=False, xscale="linear", yscale="linear", width=800,
                 height=600, tools=True, filename=False, server=False,
                 notebook=False, facet=False):
        """
        Args:
            values (iterable(tuples)): an iterable containing the data as
                (x, y) tuples.
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
            notebook (bool, optional):if you want to output (or not)
                your chart into the IPython notebook.
                Defaults to False.
            facet (bool, optional): generate multiple areas on multiple
                separate charts for each series if True. Defaults to
                False

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
        self.groups = []
        self.data = dict()
        self.attr = []
        super(Scatter, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet
        )

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content
        by default.
        """
        super(Scatter, self).check_attr()

    def get_data(self):
        """Take the scatter.values data to calculate the chart properties
        accordingly. Then build a dict containing references to all the
        calculated points to be used by the marker glyph inside the
        ``draw`` method.
        """
        self.data = dict()
        # list to save all the attributes we are going to create
        self.attr = []
        # list to save all the groups available in the incomming input
        self.groups.extend(self.values.keys())
        # Grouping
        self.parse_data()

    @property
    def parse_data(self):
        """Parse data received from self.values and create correct x, y
        series values checking if input is a pandas DataFrameGroupBy
        object or one of the stardard supported types (that can be
        converted to a DataAdapter)
        """
        if pd is not None and \
                isinstance(self.values, pd.core.groupby.DataFrameGroupBy):
            return self._parse_groupped_data
        else:
            return self._parse_data

    def _parse_groupped_data(self):
        """Parse data in self.values in case it's a pandas
        DataFrameGroupBy and create the data 'x_...' and 'y_...' values
        for all data series
        """
        for i, val in enumerate(self.values.keys()):
            xy = self.values[val]
            self._set_and_get("x_", val, xy[:, 0])
            self._set_and_get("y_", val, xy[:, 1])

    def _parse_data(self):
        """Parse data in self.values in case it's an iterable (not a pandas
        DataFrameGroupBy) and create the data 'x_...' and 'y_...' values
        for all data series
        """
        for i, val in enumerate(self.values.keys()):
            x_, y_ = [], []
            xy = self.values[val]
            for value in self.values.index:
                x_.append(xy[value][0])
                y_.append(xy[value][1])

            self.set_and_get("x_", val, x_)
            self.set_and_get("y_", val, y_)

    def get_source(self):
        """Push the Scatter data into the ColumnDataSource and
        calculate the proper ranges."""
        self.source = ColumnDataSource(self.data)

        x_names, y_names = self.attr[::2], self.attr[1::2]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(
            start=startx - 0.1 * (endx - startx),
            end=endx + 0.1 * (endx - startx)
        )
        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def draw(self):
        """Use the marker glyphs to display the points.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        duplets = list(self._chunker(self.attr, 2))
        colors = self._set_colors(duplets)

        for i, duplet in enumerate(duplets, start=1):
            self.chart.make_scatter(self.source, duplet[0], duplet[1], 'circle', colors[i - 1])

            if i < len(duplets):
                self.create_plot_if_facet()

        self.reset_legend()

    def _make_legend_glyph(self, source_legend, color):
        """Create a new glyph to represent one of the chart data series with the
        specified color

        The glyph is added to chart.glyphs.

        Args:
            source_legend (ColumnDataSource): source to be used when creating the glyph
            color (str): color of the glyph
        """
        self.chart.make_scatter(source_legend, "groups", None, 'circle', color)


    def _setup_show(self):
        """Prepare context before main show method is invoked.

        Customize show preliminary actions by handling DataFrameGroupBy
        values in order to create the series values and labels."""
        super(Scatter, self)._setup_show()

        # check if pandas is installed
        if pd:
            # if it is we try to take advantage of it's data structures
            # asumming we get an groupby object
            if isinstance(self.values, pd.core.groupby.DataFrameGroupBy):
                pdict = OrderedDict()

                for i in self.values.groups.keys():
                    self.labels = self.values.get_group(i).columns
                    xname = self.values.get_group(i).columns[0]
                    yname = self.values.get_group(i).columns[1]
                    x = getattr(self.values.get_group(i), xname)
                    y = getattr(self.values.get_group(i), yname)
                    pdict[i] = np.array([x.values, y.values]).T

                self.values = DataAdapter(pdict)
                self.labels = self.values.keys()

            else:
                self.values = DataAdapter(self.values)
                self.labels = self.values.keys()

        else:
            self.values = DataAdapter(self.values)
            self.labels = self.values.keys()

        if self._xlabel is None:
            self._xlabel = self.labels[0]

        if self._ylabel is None:
            self._ylabel = self.labels[1]