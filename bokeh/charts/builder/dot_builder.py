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
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import numpy as np
try:
    import pandas as pd

except ImportError:
    pd = None

from ..utils import chunk, cycle_colors, make_scatter
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
from ...models.glyphs import Segment
from ...properties import Any, Bool, Either, List

def Dot(values, cat=None, stem=True, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, **kws):
    """ Create a dot chart using :class:`DotBuilder <bokeh.charts.builder.dot_builder.DotBuilder>`
    to render the geometry from values and cat.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        cat (list or bool, optional): list of string representing the categories.
            Defaults to None.

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        from bokeh.charts import Dot
        from bokeh.plotting import output_file, show

        # dict, OrderedDict, lists, arrays and DataFrames are valid inputs
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]
        output_file('dot.html')
        dot = Dot(xyvalues, ['cpu1', 'cpu2'], title='dots')
        show(dot)

    """
    return create_and_build(
        DotBuilder, values, cat=cat, stem=stem, xscale=xscale, yscale=yscale,
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

    cat = Either(Bool, List(Any), help="""
    List of string representing the categories. (Defaults to None.)
    """)

    stem = Bool(True, help="""
    Whether to draw a stem from each do to the axis.
    """)

    def _process_data(self):
        """Take the Dot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``_yield_renderers`` method.

        """
        if not self.cat:
            self.cat = [str(x) for x in self._values.index]

        self._data = dict(cat=self.cat, zero=np.zeros(len(self.cat)))
        # list to save all the attributes we are going to create
        # list to save all the groups available in the incoming input
        # Grouping
        self._groups.extend(self._values.keys())
        step = np.linspace(0, 1.0, len(self._values.keys()) + 1, endpoint=False)

        for i, val in enumerate(self._values.keys()):
            values = self._values[val]
            # original y value
            self.set_and_get("", val, values)
            # x value
            cats = [c + ":" + str(step[i + 1]) for c in self.cat]
            self.set_and_get("cat", val, cats)
            # zeros
            self.set_and_get("z_", val, np.zeros(len(values)))
            # segment top y value
            self.set_and_get("seg_top_", val, values)

    def _set_sources(self):
        """Push the Dot data into the ColumnDataSource and calculate
        the proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = FactorRange(factors=self._source.data["cat"])
        cat = [i for i in self._attr if not i.startswith(("cat",))]
        end = 1.1 * max(max(self._data[i]) for i in cat)
        self.y_range = Range1d(start=0, end=end)

    def _yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the source and
        renders circle glyphs (and segments) on the related
        coordinates.
        """
        self._tuples = list(chunk(self._attr, 4))
        colors = cycle_colors(self._tuples, self.palette)

        # quartet elements are: [data, cat, zeros, segment_top]
        for i, quartet in enumerate(self._tuples):
            # draw segment first so when scatter will be place on top of it
            # and it won't show segment chunk on top of the circle
            if self.stem:
                glyph = Segment(
                    x0=quartet[1], y0=quartet[2], x1=quartet[1], y1=quartet[3],
                    line_color="black", line_width=2
                )
                yield GlyphRenderer(data_source=self._source, glyph=glyph)

            renderer = make_scatter(
                self._source, quartet[1], quartet[0], 'circle',
                colors[i - 1], line_color='black', size=15, fill_alpha=1.,
            )
            self._legends.append((self._groups[i], [renderer]))
            yield renderer
