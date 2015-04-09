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
from ..utils import make_scatter
from .._builder import TabularSourceBuilder, create_and_build
from ...models import FactorRange, GlyphRenderer, Range1d
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
        from bokeh.charts import Dot, output_file, show

        # dict, OrderedDict, lists, arrays and DataFrames are valid inputs
        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        dot = Dot(xyvalues, ['cpu1', 'cpu2'], title='dots')

        output_file('dot.html')
        show(dot)

    """
    return create_and_build(
        DotBuilder, values, cat=cat, stem=stem, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kws
    )


#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------
class DotBuilder(TabularSourceBuilder):
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
        self._data[self.prefix + 'cat'] = self.cat
        self._data[self.prefix + 'zero'] = np.zeros(len(self.cat))

        # Grouping
        step = np.linspace(0, 1.0, len(self._values.keys()) + 1, endpoint=False)
        for i, (col, values) in enumerate(self._values.items()):
            if col in self.y_names:
                # x value
                cats = [c + ":" + str(step[i + 1]) for c in self.cat]
                self._data["%scat_%s" % (self.prefix, col)] = cats

            if not col in self._data:
                self._data[col] = values

    def _set_ranges(self):
        """ Calculate the proper ranges.
        """
        self.x_range = FactorRange(factors=self._source.data[self.prefix + "cat"])
        end = 1.1 * max(max(self._data[name]) for name in self.y_names)
        self.y_range = Range1d(start=0, end=end)

    def _yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the source and
        renders circle glyphs (and segments) on the related
        coordinates.
        """
        for color, name in zip(self.colors, self.y_names):
            # draw segment first so when scatter will be place on top of it
            # and it won't show segment chunk on top of the circle
            cat = "%scat_%s" % (self.prefix, name)
            if self.stem:
                glyph = Segment(x0=cat, y0=self.prefix + "zero", x1=cat, y1=name,
                                line_color="black", line_width=2)
                yield GlyphRenderer(data_source=self._source, glyph=glyph)

            glyph = make_scatter( self._source, cat, name, 'circle',
                color, line_color='black', size=15, fill_alpha=1.)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((name, [renderer]))
            yield renderer
