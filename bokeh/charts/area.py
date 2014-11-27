from __future__ import print_function

from six import string_types

try:
    import numpy as np

except ImportError:
    print("bokeh.charts needs numpy installed to work properly!")
    raise

from ._chartobject import ChartObject, DataAdapter
from ..objects import ColumnDataSource, Range1d, DataRange1d

class Area(ChartObject):
    def __init__(self, values,
                 index=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False, stacked=False):
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

        super(Area, self).__init__(title, xlabel, ylabel, legend,
                                         xscale, yscale, width, height,
                                         tools, filename, server, notebook, facet)

    def stacked(self, stacked=True):
        """Set the areas stacked on your chart.

        Args:
            stacked (bool, optional): whether to stack the areas
                in your plot (default: True).

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

            if i < len(self.attr) - 1:
                self.create_plot_if_facet()

    def get_data(self):
        """Calculate the chart properties accordingly from area.values.
        Then build a dict containing references to all the points to be used by
        the patch glyph inside the ``draw`` method.

        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []

        xs, self.values = DataAdapter.get_index_and_data(self.values, self.index)
        last = np.zeros(len(xs))

        x2 = np.hstack((xs[::-1], xs))
        self.set_and_get("x", "", x2)

        for grp in self.values.keys():
            # TODO: This condition may be removed or changed depending on
            # the validation of self.index
            if isinstance(self.index, string_types) \
                and grp == self.index:
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
