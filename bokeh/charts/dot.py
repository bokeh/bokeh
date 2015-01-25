"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Dot class which lets you build your Dot charts just
passing the arguments to the Chart class and calling the proper functions.
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

from ._chartobject import Builder, create_and_build
from ..models import ColumnDataSource, FactorRange, Range1d


def Dot(values, cat=None, show_segment=True, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, **kws):
    return create_and_build(
        DotBuilder, values, cat=cat, show_segment=show_segment, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kws
    )


#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------
class DotBuilder(Builder):
    """This is the Dot class and it is in charge of plotting Dot chart
     in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (segments and circles) taking
    the references from the source.

    """
    def __init__(self, values, cat=None, show_segment=True,
                 legend=False, palette=None, **kws):
        """
        Args:
            values (dict): a dict containing the data with names as a key
                and the data as a value.
            cat (list or bool, optional): list of string representing the
                categories.
                Defaults to None.
            show_segment (bool, optional): shows a segment from x label to
                the rendered dot.
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True. Defaults to None.


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
        self.cat = cat
        self.values = values
        super(DotBuilder, self).__init__(legend=legend, palette=palette)

    def get_data(self):
        """Take the Dot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        """
        if not self.cat:
            self.cat = [str(x) for x in self.values.index]

        self.data = dict(cat=self.cat, zero=np.zeros(len(self.cat)))
        # list to save all the attributes we are going to create
        self.attr = []
        # list to save all the groups available in the incomming input
        # Grouping
        self.groups.extend(self.values.keys())
        step = np.linspace(0, 1.0, len(self.values.keys()) + 1, endpoint=False)

        for i, val in enumerate(self.values.keys()):
            values = self.values[val]
            # original y value
            self.set_and_get("", val, values)
            # x value
            cats = [c + ":" + str(step[i + 1]) for c in self.cat]
            self.set_and_get("cat", val, cats)
            # zeros
            self.set_and_get("z_", val, np.zeros(len(values)))
            # segment top y value
            self.set_and_get("seg_top_", val, values)

    def get_source(self):
        """Push the Dot data into the ColumnDataSource and calculate
        the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.x_range = FactorRange(factors=self.source.data["cat"])
        cat = [i for i in self.attr if not i.startswith(("cat",))]
        end = 1.1 * max(max(self.data[i]) for i in cat)
        self.y_range = Range1d(start=0, end=end)

    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the source and
        renders circle glyphs (and segments) on the related
        coordinates.
        """
        self.tuples = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.tuples)

        # quartet elements are: [data, cat, zeros, segment_top]
        for i, quartet in enumerate(self.tuples):
            # draw segment first so when scatter will be place on top of it
            # and it won't show segment chunk on top of the circle
            if self.show_segment:
                renderer = self.make_segment(
                    self.source, quartet[1], quartet[2],
                    quartet[1], quartet[3], 'black', 2,
                )
                yield renderer

            renderer = self.make_scatter(
                self.source, quartet[1], quartet[0], 'circle',
                colors[i - 1], line_color='black', size=15, fill_alpha=1.,
            )
            self._legends.append((self.groups[i], [renderer]))
            yield renderer

            # if i < len(self.tuples):
            #     self.create_plot_if_facet()

        # self.reset_legend()

    # def _make_legend_glyph(self, source_legend, color):
    #     '''Create a new glyph to represent one of the chart data series with the
    #     specified color
    #
    #     The glyph is added to chart.glyphs.
    #
    #     NOTE: Overwrites default ChartObject in order to draw a circle glyph
    #     on the legend instead of the default `rect`
    #
    #     Args:
    #         source_legend (ColumnDataSource): source to be used when creating the glyph
    #         color (str): color of the glyph
    #     '''
    #     self.chart.make_scatter(source_legend, "groups", None, 'circle',
    #                              color, "black", fill_alpha=1.)