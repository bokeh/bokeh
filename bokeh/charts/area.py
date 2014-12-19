"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Area class which lets you build your Area charts just passing
the arguments to the Chart class and calling the proper functions.
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
from __future__ import print_function

from six import string_types

try:
    import numpy as np

except ImportError:
    print("bokeh.charts needs numpy installed to work properly!")
    raise

from ._chartobject import ChartObject
from ..models import ColumnDataSource, Range1d, DataRange1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------
class Area(ChartObject):
    """This is the Area class and it is in charge of plotting
    Area chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (patch) taking the references
    from the source.

    Examples:
        from collections import OrderedDict
        from bokeh.charts import Area

        # create some example data
        xyvalues = OrderedDict(
            python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120],
            pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110],
            jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139],
        )

        # create an area chart
        area = Area(
            xyvalues, title="Area Chart", xlabel='time',
            ylabel='memory', filename="area.html",
            facet=False, stacked=True,
        )
        area.legend("top_left").show()
    """
    def __init__(self, values,
                 index=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False, stacked=False, xgrid=True, ygrid=True):
        """
        Args:
            values (iterable): iterable 2d representing the data series
                values matrix.
            index (str|1d iterable, optional): can be used to specify a
                common custom index for all data series as follows:
                    - As a 1d iterable of any sort that will be used as
                        series common index
                    - As a string that corresponds to the key of the
                        mapping to be used as index (and not as data
                        series) if area.values is a mapping (like a dict,
                        an OrderedDict or a pandas DataFrame)
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
            stacked (bool, optional): if:
                True: areas are draw as a stack to show the relationship of
                    parts to a whole
                False: areas are layered on the same chart figure. Defaults
                    to False.
            xgrid (bool, optional): defines if x-grid of your plot is
                visible or not
            ygrid (bool, optional): defines if y-grid of your plot is
                visible or not

        Attributes:
            source (obj): datasource object for your chart,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you chart,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you chart,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
            index(see inputs): received index input
        """
        self.values = values
        self.source = None
        self.xdr = None
        self.ydr = None
        self.__stacked = stacked

        # list to save all the groups available in the incomming input
        self.groups = []
        self.data = dict()
        self.attr = []
        self.index = index

        super(Area, self).__init__(
            title, xlabel, ylabel, legend, xscale, yscale, width, height,
            tools, filename, server, notebook, facet, xgrid, ygrid
        )

    def stacked(self, stacked=True):
        """Set the areas stacked on your chart.

        Args:
            stacked (bool, optional): whether to stack the areas
                in your chart (default: True).

        Returns:
            self: the chart object being configured.
        """
        self._stacked = stacked
        return self

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content by default.
        """
        super(Area, self).check_attr()

        # add specific chained method
        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def get_data(self):
        """Calculate the chart properties accordingly from area.values.
        Then build a dict containing references to all the points to be used by
        the patch glyph inside the ``draw`` method.

        """
        self.data = dict()
        # list to save all the attributes we are going to create
        self.attr = []
        xs = self.values_index
        last = np.zeros(len(xs))
        x2 = np.hstack((xs[::-1], xs))
        self.set_and_get("x", "", x2)

        for grp in self.values.keys():
            # TODO: This condition may be removed or changed depending on
            # the validation of self.index
            if isinstance(self.index, string_types) and grp == self.index:
                continue

            # get single series values
            col_values = self.values[grp]
            _values = [col_values[x] for indx, x in enumerate(xs)]

            # to draw area we need 2 coordinates. The lower values will always
            # be:
            # - 0 in case of non stacked area
            # - the previous series top value in case of stacked charts
            next = last + _values
            values = np.hstack((last[::-1], next))

            # only update when stacked, otherwise we always want to start from 0
            if self._stacked:
                last = next

            # save values and new group
            self.set_and_get("y_", grp, values)
            self.groups.append(grp)

    def get_source(self):
        """
        Push the Line data into the ColumnDataSource and calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.xdr = DataRange1d(sources=[self.source.columns("x")])

        y_names = self.attr[1:]

        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def draw(self):
        """Use the patch glyphs to fill the area connecting the xy points
         in the series taken from the data added with area.get_data.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = self._set_colors(self.attr)

        # parse all series. We exclude the first attr as it's the x values
        # added for the index
        for i, series_name in enumerate(self.attr[1:]):
            self.chart.make_patch(self.source, 'x', series_name, colors[i])

            if i < len(self.attr[1:]) - 1:
                self.create_plot_if_facet()
