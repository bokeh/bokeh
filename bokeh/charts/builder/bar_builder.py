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
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import print_function, division

try:
    import numpy as np

except ImportError:
    raise RuntimeError("bokeh.charts Bar chart requires NumPy.")

from ..utils import chunk, cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
from ...models.glyphs import Rect
from ...properties import Any, Bool, Either, List

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Bar(values, cat=None, stacked=False, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, **kw):
    return create_and_build(
        BarBuilder, values, cat=cat, stacked=stacked, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kw
    )

class BarBuilder(Builder):
    """This is the Bar class and it is in charge of plotting
    Bar chart (grouped and stacked) in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    Examples:

        from collections import OrderedDict

        xyvalues = OrderedDict()
        xyvalues['python']=[2, 5]
        xyvalues['pypy']=[12, 40]
        xyvalues['jython']=[22, 30]

        bar = Bar(xyvalues, ['1st', '2nd'], filename="stacked_bar.html")
        bar.show()
    """

    cat = Either(Bool, List(Any), help="""
    List of string representing the categories. (Defaults to None.)
    """)

    stacked = Bool(False, help="""
    Whether to stack the bars. (Defaults to False)

    If True, bars are draw as a stack, to show the relationship of
    parts to a whole. Otherwise, bars are grouped on the same chart.

    """)

    def get_data(self):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.
        """
        if not self.cat:
            self.cat = [str(x) for x in self._values.index]

        width = [0.8] * len(self.cat)
        # width should decrease proportionally to the value length.
        # 1./len(value) doesn't work well as the width needs to decrease a
        # little bit faster
        width_cat = [min(0.2, (1./len(self._values))**1.1)] * len(self.cat)
        zero = np.zeros(len(self.cat))
        self._data = dict(
            cat=self.cat, width=width, width_cat=width_cat, zero=zero
        )
        # list to save all the groups available in the incomming input grouping
        step = np.linspace(0, 1.0, len(self._values.keys()) + 1, endpoint=False)
        self._groups.extend(self._values.keys())

        for i, val in enumerate(self._values.keys()):
            self.set_and_get("", val, self._values[val])
            mid = np.array(self._values[val]) / 2
            self.set_and_get("mid", val, mid)
            self.set_and_get("stacked", val, zero + mid)
            # Grouped
            grouped = [c + ":" + str(step[i + 1]) for c in self.cat]
            self.set_and_get("cat", val, grouped)
            # Stacked
            zero += self._values[val]

    def get_source(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = FactorRange(factors=self._source.data["cat"])

        if self.stacked:
            data = np.array(self._data['zero'])
        else:
            cats = [
                i for i in self._attr
                if not i.startswith(("mid", "stacked", "cat"))
            ]
            data = np.array([self._data[cat] for cat in cats])

        sig = -1 if np.all(data < 0) else 1
        start = 0  # If you want non-zero start, set a custom y_range.
        end = sig * 1.1 * np.absolute(data).max()
        self.y_range = Range1d(start=start, end=end)

    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        quartets = list(chunk(self._attr, 4))
        colors = cycle_colors(quartets, self.palette)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(quartets):
            if self.stacked:
                glyph = Rect(
                    x="cat", y=quartet[2],
                    width="width", height=quartet[0],
                    fill_color=colors[i], fill_alpha=0.7,
                    line_color="white"
                )
            else:  # Grouped
                glyph = Rect(
                    x=quartet[3], y=quartet[1],
                    width="width_cat", height=quartet[0],
                    fill_color=colors[i], fill_alpha=0.7,
                    line_color="white"
                )
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((self._groups[i], [renderer]))
            yield renderer
