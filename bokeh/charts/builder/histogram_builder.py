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

try:
    import scipy.special
    _is_scipy = True
except ImportError as e:
    _is_scipy = False
import numpy as np

from ..utils import cycle_colors
from .._builder import TabularSourceBuilder, create_and_build
from ...models import GlyphRenderer, Range1d
from ...models.glyphs import Line, Quad
from ...properties import Bool, Float, Int

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Histogram(values, bins, mu=None, sigma=None, density=True, **kws):
    """ Create a histogram chart using :class:`HistogramBuilder <bokeh.charts.builder.histogram_builder.HistogramBuilder>`
    to render the geometry from values, bins, sigma and density.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        bins (int): number of bins to use in the Histogram building.
        mu (float, optional): theoretical mean value for the normal
            distribution. (default: None)
        sigma (float, optional): theoretical sigma value for the
            normal distribution. (default: None)
        density (bool, optional):  If False, the result will contain
            the number of samples in each bin.  If True, the result
            is the value of the probability *density* function at
            the bin, normalized such that the *integral* over the
            range is 1. For more info check numpy.histogram
            function documentation. (default: True)

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        import pandas as pd
        from bokeh.charts import Histogram, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = pd.DataFrame(dict(normal=[1, 2, 3, 1], lognormal=[5, 4, 4, 1]))

        hm = Histogram(xyvalues, bins=5, title='Histogram')

        output_file('histogram.html')
        show(hm)

    """
    return create_and_build(
        HistogramBuilder, values, bins=bins, mu=mu, sigma=sigma, density=density,
        **kws
    )


class HistogramBuilder(TabularSourceBuilder):
    """This is the Histogram class and it is in charge of plotting
    histograms in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (quads and lines) taking the
    references from the source.

    """

    bins = Int(10, help="""
    Number of bins to use for the histogram. (default: 10)
    """)

    mu = Float(help="""
    Theoretical mean value for the normal distribution. (default: None)
    """)

    sigma = Float(help="""
    Theoretical standard deviation value for the normal distribution.
    (default: None)
    """)

    density = Bool(True, help="""
    Whether to normalize the histogram. (default: True)

    If True, the result is the value of the probability *density* function
    at the bin, normalized such that the *integral* over the range is 1. If
    False, the result will contain the number of samples in each bin.

    For more info check ``numpy.histogram`` function documentation.

    """)

    def _process_data(self):
        """Take the Histogram data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the quad and line glyphs inside the ``_yield_renderers`` method.
        """
        # fill the data dictionary with the proper values
        for i, (col, values) in enumerate(self._values.items()):
            if not col in self._data:
                self._data[col] = values

            if col in self.y:
                #build the histogram using the set bins number
                hist, edges = np.histogram(
                    np.array(values), density=self.density, bins=self.bins
                )
                self._data['%shist%s' % (self.prefix, col)] = hist
                self._data["%sedges%s" % (self.prefix, col)] = edges
                self._data["%sleft%s" % (self.prefix, col)] = edges[:-1]
                self._data["%sright%s" % (self.prefix, col)] = edges[1:]
                self._data["%sbottom%s" % (self.prefix, col)] = np.zeros(len(hist))

                self._mu_and_sigma = False
                if self.mu is not None and self.sigma is not None:
                    if _is_scipy:
                        self._mu_and_sigma = True
                        x_val = self._data[self.prefix + "x" + col] = \
                            np.linspace(-2, 2, len(self._data[col]))
                        den = 2 * self.sigma ** 2
                        x_val_mu = x_val - self.mu
                        sigsqr2pi = self.sigma * np.sqrt(2 * np.pi)
                        pdf = 1 / (sigsqr2pi) * np.exp(-x_val_mu ** 2 / den)
                        self._data['%spdf%s' % (self.prefix, col)] = pdf
                        cdf = (1 + scipy.special.erf(x_val_mu / np.sqrt(den))) / 2
                        self._data['%scdf%s' % (self.prefix, col)] = cdf
                    else:
                        print("You need scipy to get the theoretical probability distributions.")

    def _set_ranges(self):
        """Push the Histogram data into the ColumnDataSource and calculate
        the proper ranges."""
        x, y = ([], [])
        if not self._mu_and_sigma:
            for name in self.y:
                x.extend(["%sleft%s" % (self.prefix, name),
                                "%sright%s" % (self.prefix, name)])
                y.extend(["%shist%s" % (self.prefix, name),
                                "%sbottom%s" % (self.prefix, name)])
        else:
            for name in self.y:
                x.extend(["%sx%s" % (self.prefix, name),
                                "%sleft%s" % (self.prefix, name),
                                "%sright%s" % (self.prefix, name)])
                y.extend(["%shist%s" % (self.prefix, name),
                                "%sbottom%s" % (self.prefix, name),
                                "%scdf%s" % (self.prefix, name),
                                "%spdf%s" % (self.prefix, name)])

        endx = max(max(self._data[name]) for name in x)
        startx = min(min(self._data[name]) for name in x)
        self.x_range = Range1d(
            start=startx - 0.1 * (endx - startx),
            end=endx + 0.1 * (endx - startx)
        )

        endy = max(max(self._data[i]) for i in y)
        self.y_range = Range1d(start=0, end=1.1 * endy)

    def _yield_renderers(self):
        """Use the several glyphs to display the Histogram and pdf/cdf.

        It uses the quad (and line) glyphs to display the Histogram
        bars, taking as reference points the data loaded at the
        ColumnDataSurce.
        """
        colors = cycle_colors(self.y, self.palette)
        for color, name in zip(colors, self.y):
            glyph = Quad(
                top='%shist%s' % (self.prefix, name),
                bottom='%sbottom%s' % (self.prefix, name),
                left='%sleft%s' % (self.prefix, name),
                right='%sright%s' % (self.prefix, name),
                fill_color=color, fill_alpha=0.7,
                line_color="white", line_alpha=1.0
            )
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((name, [renderer]))
            yield renderer

        if self._mu_and_sigma:
                glyph = Line(x='%sx%s' % (self.prefix, name),
                             y='%spdf%s' % (self.prefix, name), line_color="black")
                yield GlyphRenderer(data_source=self._source, glyph=glyph)

                glyph = Line(x='%sx%s' % (self.prefix, name),
                             y='%scdf%s' % (self.prefix, name), line_color="blue")
                yield GlyphRenderer(data_source=self._source, glyph=glyph)
