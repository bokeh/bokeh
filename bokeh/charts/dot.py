"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Dot class which lets you build your Dot charts just
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

    """
    # disable x grid
    xgrid=False

    def __init__(self, values, cat=None, show_segment=False,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False,
                 facet=False):
        """
        Args:
            values (dict): a dict containing the data with names as a key
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
            values, cat, False, # stacked is always false
            title, xlabel, ylabel, legend,
            xscale, yscale, width, height,
            tools, filename, server, notebook, facet)


    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the source   .

        Args:
            stacked (bool): whether to stack the bars in your plot.
        """
        self.tuples = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.tuples)

        # quartet elements are: [data, cat, zeros, segment_top]
        for i, quartet in enumerate(self.tuples):
            self.chart.make_scatter(
                self.source, quartet[1], quartet[0], 'circle',
                colors[i - 1], line_color='black',
                size=15,
                fill_alpha=1.,
            )

            self.chart.make_segment(
                self.source, quartet[1], quartet[2],
                quartet[1], quartet[3], 'black', 2,
            )

            if i < len(self.tuples):
                self.create_plot_if_facet()

        self.reset_legend()

    def get_data(self):
        """Take the Dot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        """
        # TODO: Clean useless code inherited from bars...
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, zero=self.zero)

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        self.groups.extend(self.values.keys())
        step = np.linspace(0, 1.0, len(self.values.keys()) + 1, endpoint=False)

        for i, val in enumerate(self.values.keys()):
            values = self.values[val]
            # original y value
            self.set_and_get("", val, self.values[val])
            # x value
            self.set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # zeros
            self.set_and_get("z_", val, np.zeros(len(self.values[val])))
            # segment top y value
            self.set_and_get("seg_top_", val, self.values[val] - np.array([2]*len(values)))

    def _make_legend_glyph(self, source_legend, color):
        self.chart.make_scatter(source_legend, "groups", None, 'circle',
                                 color, "black", fill_alpha=1.)