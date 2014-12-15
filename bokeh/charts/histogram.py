"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Histogram class which lets you build your histograms just passing
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
try:
    import scipy.special
    _is_scipy = True
except ImportError as e:
    _is_scipy = False
import numpy as np

from ._chartobject import ChartObject, DataAdapter
from ..models import ColumnDataSource, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Histogram(ChartObject):
    """This is the Histogram class and it is in charge of plotting
    histograms in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (quads and lines) taking the
    references from the source.

    Examples:
        from collections import OrderedDict
        from bokeh.charts import Histogram

        mu, sigma = 0, 0.5
        normal = [1, 2, 3, 1]
        lognormal = [5, 4, 4, 1]
        distributions = OrderedDict(normal=normal, lognormal=lognormal)
        hist = Histogram(distributions, bins=5, notebook=True)
        hist.title("Histogram").ylabel("frequency")
        hist.legend(True).width(400).height(350).show()
    """
    def __init__(self, values, bins, mu=None, sigma=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False):
        """
        Args:
            values (iterable): iterable 2d representing the data series
                values matrix.
            bins (int): number of bins to use in the Histogram building.
            mu (float, optional): theoretical mean value for the normal
                distribution. Defaults to None.
            sigma (float, optional): theoretical sigma value for the
                normal distribution. Defaults to None.
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
            data (dict): to be filled with the incoming data and be
                passed to the ColumnDataSource in each chart inherited
                class. Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created
                after loading the data dict.
                Needed for _set_And_get method.
        """
        self.values = DataAdapter(values, force_alias=False)
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        super(Histogram, self).__init__(title, xlabel, ylabel, legend,
                                        xscale, yscale, width, height,
                                        tools, filename, server, notebook,
                                        facet=facet)

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content
        by default.
        """
        super(Histogram, self).check_attr()

    def get_data(self):
        """Take the Histogram data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the quad and line glyphs inside the ``draw`` method.
        """
        # list to save all the groups available in the incomming input
        self.groups.extend(self.values.keys())

        # fill the data dictionary with the proper values
        for i, val in enumerate(self.values.keys()):
            self.set_and_get("", val, self.values[val])
            #build the histogram using the set bins number
            hist, edges = np.histogram(
                np.array(self.data[val]), density=True, bins=self.bins
            )
            self.set_and_get("hist", val, hist)
            self.set_and_get("edges", val, edges)
            self.set_and_get("left", val, edges[:-1])
            self.set_and_get("right", val, edges[1:])
            self.set_and_get("bottom", val, np.zeros(len(hist)))

            self.mu_and_sigma = False
            if self.mu is not None and self.sigma is not None:
                if _is_scipy:
                    self.mu_and_sigma = True
                    self.set_and_get("x", val, np.linspace(-2, 2, len(self.data[val])))
                    den = 2 * self.sigma ** 2
                    x_val = self.data["x" + val]
                    x_val_mu = x_val - self.mu
                    sigsqr2pi = self.sigma * np.sqrt(2 * np.pi)
                    pdf = 1 / (sigsqr2pi) * np.exp(-x_val_mu ** 2 / den)
                    self.set_and_get("pdf", val, pdf)
                    self.groups.append("pdf")
                    cdf = (1 + scipy.special.erf(x_val_mu / np.sqrt(den))) / 2
                    self.set_and_get("cdf", val, cdf)
                    self.groups.append("cdf")
                else:
                    print("You need scipy to get the theoretical probability distributions.")

    def get_source(self):
        """Push the Histogram data into the ColumnDataSource and calculate
        the proper ranges."""
        self.source = ColumnDataSource(data=self.data)

        if not self.mu_and_sigma:
            x_names, y_names = self.attr[2::6], self.attr[1::6]
        else:
            x_names, y_names = self.attr[2::9], self.attr[1::9]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx),
                           end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)

        self.ydr = Range1d(start=0, end=1.1 * endy)

    def draw(self):
        """Use the several glyphs to display the Histogram and pdf/cdf.

        It uses the quad (and line) glyphs to display the Histogram
        bars, taking as reference points the data loaded at the
        ColumnDataSurce.
        """
        if not self.mu_and_sigma:
            sextets = list(self._chunker(self.attr, 6))
            colors = self._set_colors(sextets)

            # sixtet: values, his, edges, left, right, bottom
            for i, sextet in enumerate(sextets):
                self.chart.make_quad(
                    self.source, sextet[1], sextet[5], sextet[3],
                    sextet[4], colors[i], "white"
                )

                # if facet we need to generate multiple histograms of multiple
                # series on multiple separate plots
                if i < len(sextets)-1:
                    self.create_plot_if_facet()

        else:
            nonets = list(self._chunker(self.attr, 9))
            colors = self._set_colors(nonets)

            # nonetet: values, his, edges, left, right, bottom, x, pdf, cdf
            for i, nonet in enumerate(nonets):
                self.chart.make_quad(
                    self.source, nonet[1], nonet[5], nonet[3],
                    nonet[4], colors[i], "white"
                )
                self.chart.make_line(self.source, nonet[6], nonet[7], "black")
                self.chart.make_line(self.source, nonet[6], nonet[8], "blue")

                # if facet we need to generate multiple histograms of multiple
                # series on multiple separate plots
                if i < len(nonets)-1:
                    self.create_plot_if_facet()