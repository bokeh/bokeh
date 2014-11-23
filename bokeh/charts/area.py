from .line import Line
from collections import OrderedDict
import numpy as np


class Area(Line):
    def draw(self):
        """Use the line glyphs to connect the xy points in the time series.

        Takes reference points from the data loaded at the ColumnDataSurce.
        """

        self.duplet = list(self._chunker(self.attr, 2))
        colors = self._set_colors(self.attr)

        for i, duplet in enumerate(self.attr[1:], start=1):
            self.chart.make_patch(self.source, 'x', duplet, colors[i - 1])

            if i < len(self.duplet):
                self.create_plot_if_facet()


    def get_data(self):#, xy):
        """Take the x/y data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the line glyph inside the ``draw`` method.

        Args:
            xy (dict): a dict containing the data with names as a key
                and the data as a value.
        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []

        xs, self.xy = self.prepare_data(self.xy)
        import numpy as np

        last = np.zeros(len(xs))

        x2 = np.hstack((xs[::-1], xs))
        self.set_and_get("x", "", x2)
        #self.set_and_get("x", "", np.array(xs))

        #prevs = [] #OrderedDict()
        #cvals = np.array(self.xy.values()).T

        #for row in cvals:
        #    row = sorted(row)
        #    prow = [0] + row[:-1]
        #    vv = {}
        #    for v, pv in zip(row, prow):
        #        vv[v] = pv
        #
        #    prevs.append(vv)

        for indrow, col in enumerate(self.xy.keys()):
            if isinstance(self.index, basestring) \
                and col == self.index:
                continue

            values = []
            #prevvalues = []
            for indx, x in enumerate(xs):
                v = self.xy[col][x]
                values.append(v)
            #    prevvalues.append(prevs[indx][v])

            #values = np.array(values)
            next = last + values
            #next = np.hstack((prevvalues[::-1], values))

            values = np.hstack((last[::-1], next))
            #_values = np.hstack((prevvalues[::-1], next))

            self.set_and_get("y_", col, values)

            # save every new group we find
            self.groups.append(col)

