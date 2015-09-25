"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Histogram class which lets you build your histograms just passing
the arguments to the Chart class and calling the proper functions.
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

from ...models import Range1d
from ...properties import Bool, Int

from .._builder import create_and_build
from .bar_builder import BarBuilder
from ..glyphs import HistogramGlyph

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Histogram(data, values=None, label=None, color=None, agg="count",
              bins=None, yscale="linear", xgrid=False, ygrid=True,
              continuous_range=None, **kw):

    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )

    # The continuous_range is the y_range (until we implement HBar charts)
    y_range = continuous_range
    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['agg'] = agg
    kw['yscale'] = yscale
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['y_range'] = y_range
    kw['bins'] = bins

    return create_and_build(HistogramBuilder, data, **kw)


class HistogramBuilder(BarBuilder):
    """Generates one to many histograms with unique attributes.

    The HistogramBuilder is responsible for producing a chart
    containing one to many histograms from table-like inputs.

    """

    bins = Int(default=None, help="""
    Number of bins to use for the histogram. (default: None
    (use Freedman-Diaconis rule)
    """)

    density = Bool(True, help="""
    Whether to normalize the histogram. (default: True)

    If True, the result is the value of the probability *density* function
    at the bin, normalized such that the *integral* over the range is 1. If
    False, the result will contain the number of samples in each bin.

    For more info check ``numpy.histogram`` function documentation.

    """)

    glyph = HistogramGlyph

    def _setup(self):
        super(HistogramBuilder, self)._setup()

        if self.attributes['color'].columns is not None:
            self.fill_alpha = 0.6

    def get_extra_args(self):
        return dict(bin_count=self.bins)

    def _set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """

        x_max = max([comp_glyph.x_max for comp_glyph in self.comp_glyphs])
        x_min = min([comp_glyph.x_min for comp_glyph in self.comp_glyphs])
        y_max = max([comp_glyph.y_max for comp_glyph in self.comp_glyphs])
        y_min = min([comp_glyph.y_min for comp_glyph in self.comp_glyphs])

        x_buffer = ((x_max + x_min)/2.0)*0.1

        self.x_range = Range1d(start=x_min - x_buffer, end=x_max + x_buffer)

        self.y_range = Range1d(start=y_min, end=y_max * 1.1)
