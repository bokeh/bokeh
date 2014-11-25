"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Bar class which lets you build your Bar charts just passing
the arguments to the Chart class and calling the proper functions.
It also add a new chained stacked method.
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
    import numpy as np

except ImportError:
    print "bokeh.charts needs numpy installed to work properly!"
    raise

from ._chartobject import ChartObject, DataAdapter
from ..objects import ColumnDataSource, FactorRange, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Bar(ChartObject):
    """This is the Bar class and it is in charge of plotting
    Bar chart (grouped and stacked) in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    Examples:

        from collections import OrderedDict

        import numpy as np

        from bokeh.charts import Bar
        from bokeh.sampledata.olympics2014 import data

        data = {d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

        countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)

        gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
        silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
        bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

        medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

        bar = Bar(medals, countries)
        bar.title("stacked, dict_input").xlabel("countries").ylabel("medals")\
.legend(True).width(600).height(400).stacked().notebook().show()
    """
    # disable x grid
    xgrid=False

    def __init__(self, value, cat=None, stacked=False,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False):
        """
        Args:
            value (dict): a dict containing the data with names as a key
                and the data as a value.
            cat (list or bool, optional): list of string representing the categories.
                Defaults to None.
            stacked (bool, optional): to see the bars stacked or grouped.
                Defaults to False, so grouping is assumed.
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
                Defaults to ``linear``.
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
            notebook (bool or optional):if you want to output (or not) your plot into the
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
        self.cat = cat
        self.value = value
        self.__stacked = stacked
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        super(Bar, self).__init__(title, xlabel, ylabel, legend,
                                  xscale, yscale, width, height,
                                  tools, filename, server, notebook, facet)

    def stacked(self, stacked=True):
        """Set the bars stacked on your chart.

        Args:
            stacked (bool, optional): whether to stack the bars
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
        super(Bar, self).check_attr()

        # add specific chained method
        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def get_source(self):
        """Push the Bar data into the ColumnDataSource and calculate the proper ranges.

        Args:
            stacked (bool): whether to stack the bars in your plot.
        """
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        if self._stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSurce.

        Args:
            stacked (bool): whether to stack the bars in your plot.
        """
        self.quartet = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.quartet)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(self.quartet):
            if self._stacked:
                self.chart.make_rect(self.source, "cat", quartet[2], "width", quartet[0], colors[i], "white", None)
            else:  # Grouped
                self.chart.make_rect(self.source, quartet[3], quartet[1], "width_cat", quartet[0], colors[i], "white", None)

    def _setup_show(self):
        super(Bar, self)._setup_show()

        # normalize input to the common DataAdapter Interface
        self.value = DataAdapter(self.value, force_alias=False)
        if not self.cat:
            vals = map(str, self.value.index)
            self.cat = vals

    def get_data(self):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        Args:
            cat (list): categories as a list of strings
            values (dict or pd obj): the values to be plotted as bars.
        """
        self.width = [0.8] * len(self.cat)
        # width should decrease proportionally to the value length.
        # 1./len(value) doesn't work well as the width needs to decrease a
        # little bit faster
        self.width_cat = [min(0.2, (1./len(self.value))**1.1)] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        self.groups.extend(self.value.keys())
        for i, val in enumerate(self.value.keys()):
            self.set_and_get("", val, self.value[val])
            self.set_and_get("mid", val, np.array(self.value[val]) / 2)
            self.set_and_get("stacked", val, self.zero + np.array(self.value[val]) / 2)
            # Grouped
            self.set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # Stacked
            self.zero += self.value[val]
