"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Bar class which lets you build your bar plots just passing
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

import numpy as np
import pandas as pd

from ._chartobject import ChartObject

from ..objects import ColumnDataSource, FactorRange, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Bar(ChartObject):
    """This is the Bar class and it is in charge of plotting
    bar chart (grouped and stacked) in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
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
    def __init__(self, value, cat=None, stacked=False,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """
        Args:
            value (dict): a dict containing the data with names as a key
                and the data as a value.
            cat (list, bool, optional): list of string representing the categories.
                Defaults to None.
            stacked (bool, optional): to see the bars stacked or grouped.
                Defaults to False, so grouping is assumed.
            title (str, optional): the title of your plot. Defaults to None.
            xlabel (str, optional): the x-axis label of your plot.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your plot.
                Defaults to None.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be `top_left`,
                `top_right`, `bottom_left`, `bottom_right`.
                It is `top_right` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
                Defaults to `linear`.
            yscale (str, optional): the y-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
                Defaults to `linear`.
            width (int, optional): the width of your plot in pixels.
                Defaults to 800.
            height (int, optional): the height of you plot in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your plot.
                Defaults to True
            filename (str, bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                "untitled" as a filename.
                Defaults to False.
            server (str, bool, optional): the name of your plot in the server.
                If you pass True to this argument, it will use "untitled"
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
                                  tools, filename, server, notebook)

    def stacked(self, stacked=True):
        """stacked (bool): to stack (or not) the bars in your plot.

        It defaults to True if you use the method without any parameter.
        """
        self._stacked = stacked
        return self

    def check_attr(self):
        """This method checks if any of the chained method were used. If they were
        not used, it assign the init params content by default.
        """
        super(Bar, self).check_attr()

        # add specific chained method
        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def get_data(self, cat, **value):
        """Take the bar data from the input **value and calculate the
        parameters accordingly. Then build a dict containing references
        to all the calculated point to be used by the quad glyph inside the
        `draw` method.
        """
        self.cat = cat
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict, ordered dict
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        self.groups.extend(self.value.keys())

        for i, val in enumerate(self.value.keys()):
            self._set_and_get("", val, self.value[val])
            self._set_and_get("mid", val, self.value[val] / 2)
            self._set_and_get("stacked", val, self.zero + self.value[val] / 2)
            # Grouped
            self._set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # Stacked
            self.zero += self.value[val]

    def get_source(self, stacked):
        """Get the bar data dict into the ColumnDataSource and
        calculate the proper ranges."""
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        if stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

    def draw(self, stacked):
        """Use the rect glyphs to display the bars, taking as
        reference points the data loaded at the ColumnDataSurce.
        """
        self.quartet = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.quartet)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(self.quartet):
            if stacked:
                self.chart.make_rect("cat", quartet[2], "width", quartet[0], colors[i])
            else:  # Grouped
                self.chart.make_rect(quartet[3], quartet[1], "width_cat", quartet[0], colors[i])

    def show(self):
        """This is the main Bar show function.
        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        Note: the show method can not be chained. It has to be called
        at the end of the chain.
        """
        # if we pass a pandas df, the cat are guessed
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.index.values.tolist()

        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.create_chart()
        # we start the plot (adds axis, grids and tools)
        self.start_plot()
        # we get the data from the incoming input
        self.get_data(self.cat, **self.value)
        # we filled the source and ranges with the calculated data
        self.get_source(self._stacked)
        # we dinamically inject the source and ranges into the plot
        self.add_data_plot()
        # we add the glyphs into the plot
        self.draw(self._stacked)
        # we pass info to build the legend
        self.end_plot()
        # and finally we show it
        self.show_chart()

    # Some helper methods
    def _set_and_get(self, prefix, val, content):
        """Set a new attr and then get it to fill the self.data dict.
        Keep track of the attributes created.

        Args:
            prefix (str): prefix of the new attribute
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        setattr(self, prefix + val, content)
        self.data[prefix + val] = getattr(self, prefix + val)
        self.attr.append(prefix + val)