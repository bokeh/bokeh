from .line import Line

try:
    import numpy as np

except ImportError:
    print "bokeh.charts needs numpy installed to work properly!"
    raise

class Area(Line):
    def __init__(self, values,
                 index=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False, stacked=False):
        self.stacked = stacked

        super(Area, self).__init__(
            values, index, title, xlabel, ylabel, legend,
            xscale, yscale, width, height,
            tools, filename, server, notebook, facet
        )

    def draw(self):
        """Use the patch glyphs to fill the area connecting the xy points
         in the series.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = self._set_colors(self.attr)

        for i, series_name in enumerate(self.attr[1:]):
            self.chart.make_patch(self.source, 'x', series_name, colors[i])

            if i < len(self.attr) - 1:
                self.create_plot_if_facet()

    def get_data(self):
        """Calculate the chart properties accordingly from line.values.
        Then build a dict containing references to all the points to be used by
        the patch glyph inside the ``draw`` method.

        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []

        xs, self.values = self.prepare_data(self.values)
        last = np.zeros(len(xs))

        x2 = np.hstack((xs[::-1], xs))
        self.set_and_get("x", "", x2)

        for grp in self.values.keys():
            # TODO: This condition may be removed or changed depending on
            # the validation of self.index
            if isinstance(self.index, basestring) \
                and grp == self.index:
                continue

            # get single series values
            col_values = self.values[grp]
            _values = [col_values[x] for indx, x in enumerate(xs)]

            # to draw area we need 2 coordinates. The lower values will always
            # be 0 in case of non stacked area and will be the previous series
            # top value in case of stacked charts
            next = last + _values
            values = np.hstack((last[::-1], next))

            # only update when stacked, otherwise we always want to start from 0
            if self.stacked:
                last = next

            # save values and new group
            self.set_and_get("y_", grp, values)
            self.groups.append(grp)