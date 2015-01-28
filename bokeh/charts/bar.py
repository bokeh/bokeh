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
from __future__ import print_function, division

try:
    import numpy as np

except ImportError:
    print("bokeh.charts.Bar needs numpy installed to work properly!")
    raise

from ._chartobject import Builder, create_and_build
from ..models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
from ..models.glyphs import Rect

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
        bar.title("Stacked bars").xlabel("countries").ylabel("medals")
        bar.legend(True).width(600).height(400).stacked(True)
        bar.show()
    """

    def __init__(self, values, cat=None, stacked=False, legend=False, **kws):
        """
        Args:
            values (iterable): iterable 2d representing the data series values matrix.
            cat (list or bool, optional): list of string representing the categories.
                Defaults to None.
            stacked (bool, optional): to see the bars stacked or grouped.
                Defaults to False, so grouping is assumed.
            legend (str, optional): the legend of your chart. The legend
                content is inferred from incoming input.It can be
                ``top_left``, ``top_right``, ``bottom_left``,
                ``bottom_right``. ``top_right`` is set if you set it
                 as True. Defaults to None.

        Attributes:
            source (obj): datasource object for your chart,
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
        self.cat = cat
        self._stacked = stacked

        super(BarBuilder, self).__init__(legend)

    def get_data(self):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.
        """
        if not self.cat:
            self.cat = [str(x) for x in self.values.index]

        width = [0.8] * len(self.cat)
        # width should decrease proportionally to the value length.
        # 1./len(value) doesn't work well as the width needs to decrease a
        # little bit faster
        width_cat = [min(0.2, (1./len(self.values))**1.1)] * len(self.cat)
        zero = np.zeros(len(self.cat))
        self.data = dict(
            cat=self.cat, width=width, width_cat=width_cat, zero=zero
        )

        # list to save all the groups available in the incomming input grouping
        step = np.linspace(0, 1.0, len(self.values.keys()) + 1, endpoint=False)
        self.groups.extend(self.values.keys())

        for i, val in enumerate(self.values.keys()):
            self.set_and_get("", val, self.values[val])
            mid = np.array(self.values[val]) / 2
            self.set_and_get("mid", val, mid)
            self.set_and_get("stacked", val, zero + mid)
            # Grouped
            grouped = [c + ":" + str(step[i + 1]) for c in self.cat]
            self.set_and_get("cat", val, grouped)
            # Stacked
            zero += self.values[val]

    def get_source(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        self.source = ColumnDataSource(self.data)

        self.x_range = FactorRange(factors=self.source.data["cat"])

        if self._stacked:
            self.y_range = Range1d(start=0, end=1.1 * max(self.data['zero']))
        else:
            cat = [i for i in self.attr
                   if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.y_range = Range1d(start=0, end=end)

    def draw(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        quartets = list(self._chunker(self.attr, 4))
        colors = self._set_colors(quartets)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(quartets):
            if self._stacked:
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
            renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
            self._legends.append((self.groups[i], [renderer]))
            yield renderer