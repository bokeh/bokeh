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
from __future__ import absolute_import, print_function, division

try:
    import numpy as np
except ImportError:
    raise RuntimeError("bokeh.charts Bar chart requires NumPy.")

from .._builder import Builder, create_and_build
from ...models import FactorRange, Range1d
from ...models.glyphs import Rect
from ...properties import Any, Bool, Either, List

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Bar(values, cat=None, stacked=False, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, continuous_range=None, **kw):
    """ Create a Bar chart using :class:`BarBuilder <bokeh.charts.builder.bar_builder.BarBuilder>`
    render the geometry from values, cat and stacked.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        cat (list or bool, optional): list of string representing the categories.
            (Defaults to None)
        stacked (bool, optional): to see the bars stacked or grouped.
            (Defaults to False, so grouping is assumed)
        continuous_range(Range1d, optional): Custom continuous_range to be
            used. (Defaults to None)

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

        .. bokeh-plot::
            :source-position: above

            from collections import OrderedDict
            from bokeh.charts import Bar, output_file, show

            # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
            xyvalues = OrderedDict()
            xyvalues['python']=[-2, 5]
            xyvalues['pypy']=[12, 40]
            xyvalues['jython']=[22, 30]

            cat = ['1st', '2nd']

            bar = Bar(xyvalues, cat, title="Stacked bars",
                    xlabel="category", ylabel="language")

            output_file("stacked_bar.html")
            show(bar)

    """
    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )
    # The continuous_range is the y_range (until we implement HBar charts)
    y_range = continuous_range

    return create_and_build(
        BarBuilder, values, cat=cat, stacked=stacked,
        xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, y_range=y_range, **kw
    )


class BarBuilder(Builder):
    """This is the Bar class and it is in charge of plotting
    Bar chart (grouped and stacked) in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    The x_range is categorical, and is made either from the cat argument
    or from the indexes of the passed values if no cat is supplied.  The
    y_range can be supplied as the parameter continuous_range,
    or will be calculated as a linear range (Range1d) based on the supplied
    values using the following rules:

     * with all positive data: start = 0, end = 1.1 * max
     * with all negative data: start = 1.1 * min, end = 0
     * with mixed sign data:   start = 1.1 * min, end = 1.1 * max

    """

    cat = Either(Bool, List(Any), help="""
    List of string representing the categories. (Defaults to None.)
    """)

    stacked = Bool(False, help="""
    Whether to stack the bars. (Defaults to False)

    If True, bars are draw as a stack, to show the relationship of
    parts to a whole. Otherwise, bars are grouped on the same chart.

    """)

    def _process_data(self):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``_yield_renderers`` method.
        """
        if not self.cat:
            self.cat = [str(x) for x in self._values.index]
        self._data[self.prefix + 'cat'] = self.cat

        self._data[self.prefix + 'width'] = [0.8] * len(self.cat)
        # width should decrease proportionally to the value length.
        # 1./len(value) doesn't work well as the width needs to decrease a
        # little bit faster
        self._data[self.prefix + 'width_cat'] = \
            [min(0.2, (1. / len(self._values)) ** 1.1)] * len(self.cat)
        self._data[self.prefix + 'zero'] = zero = np.zeros(len(self.cat))

        # list to save all the groups available in the incomming input grouping
        step = np.linspace(0, 1.0, len(self._values.keys()) + 1, endpoint=False)

        for i, (val, values) in enumerate(self._values.items()):
            if not val in self._data:
                self._data[val] = list(values)
            mid = np.array(values) / 2
            self._data["%smid%s" % (self.prefix, val)] = mid
            # Grouped
            self._data["%scat%s" % (self.prefix, val)] = [c + ":" + str(step[i + 1]) for c in self.cat]
            # Stacked
            self._data["%sstacked%s" % (self.prefix, val)] = zero + mid
            zero += values

    def _set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        if not self.x_range:
            self.x_range = FactorRange(factors=self._source.data[self.prefix + "cat"])

        if not self.y_range:
            if self.stacked:
                data = np.array(self._data[self.prefix + 'zero'])
            else:
                # cats = [i for i in self.y_names if not i.startswith(("mid", "stacked", "cat"))]
                data = np.array([self._data[cat] for cat in self.y_names])

            all_positive = True if np.all(data > 0) else False
            all_negative = True if np.all(data < 0) else False

            start = 0 if all_positive else 1.1 * data.min()  # Will always be negative
            end = 0 if all_negative else 1.1 * data.max()

            self.y_range = Range1d(start=start, end=end)

    def _create_glyph(self, xname, yname, color):
        if self.stacked:
            return Rect(
                x=self.prefix + "cat", y="%sstacked%s" % (self.prefix, yname),
                width=self.prefix + "width", height=yname,
                fill_color=color, fill_alpha=0.7, line_color="white"
            )
        else:
            return Rect(
                x="%scat%s" % (self.prefix, yname), y="%smid%s" % (self.prefix, yname),
                width=self.prefix + "width_cat", height=yname, fill_color=color,
                fill_alpha=0.7, line_color="white"
            )