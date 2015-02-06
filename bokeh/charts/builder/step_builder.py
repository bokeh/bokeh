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
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import numpy as np
from six import string_types

from ..utils import cycle_colors
from .._builder import create_and_build, Builder
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer
from ...models.glyphs import Line
from ...properties import Any

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

    index = Any(help="""
    An index to be used for all data series as follows:

    - A 1d iterable of any sort that will be used as
        series common index

    - As a string that corresponds to the key of the
        mapping to be used as index (and not as data
        series) if area.values is a mapping (like a dict,
        an OrderedDict or a pandas DataFrame)

    """)

    def get_data(self):
        """It calculates the chart properties accordingly from Step.values.
        Then build a dict containing references to all the points to be
        used by the segment glyph inside the ``draw`` method.
        """
        self._data = dict()
        self._groups = []

        orig_xs = self._values_index
        xs = np.empty(2*len(orig_xs)-1, dtype=np.int)
        xs[::2] = orig_xs[:]
        xs[1::2] = orig_xs[1:]
        self._data['x'] = xs

        for i, col in enumerate(self._values.keys()):
            if isinstance(self.index, string_types) and col == self.index:
                continue

            # save every new group we find
            self._groups.append(col)

            orig_ys = np.array([self._values[col][x] for x in orig_xs])
            ys = np.empty(2*len(orig_ys)-1)
            ys[::2] = orig_ys[:]
            ys[1::2] = orig_ys[:-1]
            self._data['y_%s' % col] = ys

    def get_source(self):
        """ Push the Step data into the ColumnDataSource and calculate
        the proper ranges.
        """
        sc = self._source = ColumnDataSource(self._data)
        self.x_range = DataRange1d(sources=[sc.columns("x")])

        y_sources = [sc.columns("y_%s" % col) for col in self._groups]
        self.y_range = DataRange1d(sources=y_sources)

    def draw(self):
        """Use the line glyphs to connect the xy points in the Step.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self._groups, self.palette)

        for i, name in enumerate(self._groups):
            # draw the step horizontal segment
            glyph = Line(x="x", y="y_%s" % name, line_color=colors[i], line_width=2)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((self._groups[i], [renderer]))
            yield renderer
