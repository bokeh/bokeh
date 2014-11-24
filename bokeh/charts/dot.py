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
import numpy as np
try:
    import pandas as pd

except ImportError:
    pd = None

from .bar import Bar
#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Dot(Bar):
    """This is the Dot class and it is in charge of plotting
    Dot chart (grouped and stacked) in an easy and intuitive way.

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

    def __init__(self, value, cat=None, show_segment=False,
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
        self.show_segment = show_segment
        super(Dot, self).__init__(
            value, cat, False, # stacked is always false
            title, xlabel, ylabel, legend,
            xscale, yscale, width, height,
            tools, filename, server, notebook, facet)


    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSurce.

        Args:
            stacked (bool): whether to stack the bars in your plot.
        """
        self.tuples = list(self._chunker(self.attr, 6  ))
        colors = self._set_colors(self.tuples)

        # sixtet elements are: [data, mid, stacked, cat, zeros, segment_top]
        for i, sixtet in enumerate(self.tuples):
            self.chart.make_scatter(
                self.source, sixtet[3], sixtet[0], 'circle',
                colors[i - 1], line_color='black',
                size=15,
                fill_alpha=1.,
            )

            self.chart.make_segment(
                self.source,
                sixtet[3],
                sixtet[4],
                sixtet[3],
                sixtet[5],
                'black',
                2,
            )

            if i < len(self.tuples):
                self.create_plot_if_facet()

    def get_data(self): #, cat, value):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        Args:
            cat (list): categories as a list of strings
            values (dict or pd obj): the values to be plotted as bars.
        """
        # TODO: Clean useless code inherited from bars...
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, zero=self.zero)

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        self.groups.extend(self.value.keys())
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        for i, val in enumerate(self.value.keys()):
            values = self.value[val]
            self.set_and_get("", val, self.value[val])
            self.set_and_get("mid", val, np.array(self.value[val]) / 2)
            self.set_and_get("stacked", val, self.zero + np.array(self.value[val]) / 2)
            # Grouped
            self.set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # Stacked
            self.zero += self.value[val]

            self.set_and_get("z_", val, np.zeros(len(self.value[val])))
            self.set_and_get("seg_top_", val, self.value[val] - np.array([2]*len(values)))
