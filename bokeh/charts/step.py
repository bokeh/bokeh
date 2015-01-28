"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Step class which lets you build your Step charts just
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

from six import string_types
import numpy as np
from ._builder import create_and_build, Builder
from ..models import ColumnDataSource, DataRange1d, GlyphRenderer, Range1d
from ..models.glyphs import Segment

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Step(values, index=None, **kws):
    return create_and_build(StepBuilder, values, index=index, **kws)


class StepBuilder(Builder):
    """This is the Step class and it is in charge of plotting
    Step charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the
    source.

    """
    def __init__(self, values, index=None, legend=False, palette=None, **kws):
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
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.

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
        self.values = values
        # self.source = None
        # self.xdr = None
        # self.ydr = None
        # # list to save all the groups available in the incoming input
        # self.groups = []
        # self.data = dict()
        # self.attr = []
        self.index = index

        super(StepBuilder, self).__init__(legend=legend, palette=palette)

    def get_data(self):
        """It calculates the chart properties accordingly from Step.values.
        Then build a dict containing references to all the points to be
        used by the segment glyph inside the ``draw`` method.
        """
        self.data = dict()

        # list to save all the attributes we are going to create
        self.attr = []
        self.groups = []
        xs = self.values_index
        self.set_and_get("x", "", np.array(xs)[:-1])
        self.set_and_get("x2", "", np.array(xs)[1:])
        for col in self.values.keys():
            if isinstance(self.index, string_types) and col == self.index:
                continue

            # save every new group we find
            self.groups.append(col)
            values = [self.values[col][x] for x in xs]
            self.set_and_get("y1_", col, values[:-1])
            self.set_and_get("y2_", col, values[1:])

    def get_source(self):
        """ Push the Step data into the ColumnDataSource and calculate
        the proper ranges.
        """
        sc = self.source = ColumnDataSource(self.data)
        self.x_range = DataRange1d(sources=[sc.columns("x"), sc.columns("x2")])

        y_names = self.attr[1:]
        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def draw(self):
        """Use the line glyphs to connect the xy points in the Step.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        tuples = list(self._chunker(self.attr[2:], 2))
        colors = self._set_colors(tuples)

        # duplet: y1, y2 values of each series
        for i, duplet in enumerate(tuples):

            # draw the step horizontal segment
            glyph = Segment(
                x0="x2", y0=duplet[0], x1="x2", y1=duplet[1],
                line_color=colors[i]
            )
            yield GlyphRenderer(data_source=self.source, glyph=glyph)

            # draw the step vertical segment
            glyph = Segment(
                x0="x", y0=duplet[0], x1="x2", y1=duplet[0],
                line_color=colors[i]
            )
            renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
            self._legends.append((self.groups[i], [renderer]))
            yield renderer
