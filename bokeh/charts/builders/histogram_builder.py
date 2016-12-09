"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Histogram class which lets you build your histograms just passing
the arguments to the Chart class and calling the proper functions.
"""

# ToDo: handle different aggregation types other than count with Bins

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
from ...core.properties import Bool, Int, Either, Float, List

from ..builder import create_and_build
from .bar_builder import BarBuilder
from ..glyphs import HistogramGlyph

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Histogram(data, values=None, label=None, color=None, agg="count",
              bins=None, yscale="linear", xgrid=False, ygrid=True,
              continuous_range=None, **kw):
    """ Create a histogram chart with one or more histograms.

    Create a histogram chart using :class:`HistogramBuilder
    <bokeh.charts.builders.histogram_builder.HistogramBuilder>` to
    render the glyphs from input data and specification. This primary
    use case for the histogram is to depict the distribution of a
    variable by binning and aggregating the values in each bin.

    This chart implements functionality to provide convenience in optimal
    selection of bin count, but also for segmenting and comparing segments of
    the variable by a categorical variable.

    Args:
      data (:ref:`userguide_charts_data_types`): the data source for the chart.
        Must consist of at least 2 values. If all values are equal, the result
        is a single bin with arbitrary width.
      values (str, optional): the values to use for producing the histogram using
        table-like input data
      label (str or list(str), optional): the categorical variable to use for creating
        separate histograms
      color (str or list(str) or `~bokeh.charts._attributes.ColorAttr`, optional): the
        categorical variable or color attribute specification to use for coloring the
        histogram, or explicit color as a string.
      agg (str, optional): how to aggregate the bins. Defaults to "count".
      bins (int or list(float), optional): the number of bins to use, or an explicit
        list of bin edges. Defaults to None to auto select.
      density (bool, optional): whether to normalize the histogram. Defaults to False.

      **kw:

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the histograms

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import Histogram, output_file, show
        from bokeh.layouts import row
        from bokeh.sampledata.autompg import autompg as df

        hist = Histogram(df, values='mpg', title="Auto MPG Histogram", plot_width=400)
        hist2 = Histogram(df, values='mpg', label='cyl', color='cyl', legend='top_right',
                          title="MPG Histogram by Cylinder Count", plot_width=400)

        output_file('hist.html')
        show(row(hist, hist2))
    """
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

    bins = Either(List(Float), Int, default=None, help="""
    If bins is an int, it defines the number of equal-width bins in the
    given range. If bins is a sequence, it defines the
    bin edges, including the rightmost edge, allowing for non-uniform
    bin widths.

    (default: None, use Freedman-Diaconis rule)
    """)

    density = Bool(False, help="""
    Whether to normalize the histogram.

    If True, the result is the value of the probability *density* function
    at the bin, normalized such that the *integral* over the range is 1. If
    False, the result will contain the number of samples in each bin.

    For more info check :class:`~bokeh.charts.glyphs.HistogramGlyph`
    documentation.

    (default: False)
    """)

    glyph = HistogramGlyph

    def setup(self):
        super(HistogramBuilder, self).setup()

        # when we create multiple histograms, we set the alpha to support overlap
        if self.attributes['color'].columns is not None:
            self.fill_alpha = 0.6

    def get_extra_args(self):
        """Build kwargs that are unique to the histogram builder."""
        return dict(bins=self.bins, density=self.density)

    def _apply_inferred_index(self):
        # ignore this for now, unless histogram later adds handling of indexed data
        pass

    def set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """

        x_max = max([comp_glyph.x_max for comp_glyph in self.comp_glyphs])
        x_min = min([comp_glyph.x_min for comp_glyph in self.comp_glyphs])
        y_max = max([comp_glyph.y_max for comp_glyph in self.comp_glyphs])
        y_min = min([comp_glyph.y_min for comp_glyph in self.comp_glyphs])

        x_buffer = ((x_max + x_min)/2.0)*0.05

        self.x_range = Range1d(start=x_min - x_buffer, end=x_max + x_buffer)

        self.y_range = Range1d(start=y_min, end=y_max * 1.1)
