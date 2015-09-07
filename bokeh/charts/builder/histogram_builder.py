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

from ..utils import chunk, cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, GlyphRenderer, Range1d, FactorRange
from ...models.glyphs import Line, Quad
from ...properties import Bool, Float, Int

from .bar_builder import BarBuilder
from ..glyphs import HistogramGlyph

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Histogram(data, values=None, label=None, color=None, agg="count",
            yscale="linear",
            xgrid=False, ygrid=True, continuous_range=None, **kw):


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

    return create_and_build(HistogramBuilder, data, **kw)


class HistogramBuilder(BarBuilder):
    """This is the Histogram class and it is in charge of plotting
    histograms in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (quads and lines) taking the
    references from the source.

    """

    bins = Int(default=None, help="""
    Number of bins to use for the histogram. (default: None (use Freedman-Diaconis rule)
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

    glyph = HistogramGlyph

    def _set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """

        x_max = max([comp_glyph.x_max for comp_glyph in self.renderers])
        x_min = min([comp_glyph.x_min for comp_glyph in self.renderers])
        y_max = max([comp_glyph.y_max for comp_glyph in self.renderers])
        y_min = min([comp_glyph.y_min for comp_glyph in self.renderers])

        x_buffer = ((x_max + x_min)/2.0)*0.1

        self.x_range = Range1d(start=x_min - x_buffer, end=x_max + x_buffer)

        self.y_range = Range1d(start=y_min, end=y_max * 1.1)

    # def _process_data(self):
    #     """Take the Histogram data from the input **value.
    #
    #     It calculates the chart properties accordingly. Then build a dict
    #     containing references to all the calculated points to be used by
    #     the quad and line glyphs inside the ``_yield_renderers`` method.
    #     """
        # list to save all the groups available in the incomming input
        # self._groups.extend(self._values.keys())
        #
        # # fill the data dictionary with the proper values
        # for i, (val, values) in enumerate(self._values.items()):
        #     self.set_and_get("", val, values)
        #     #build the histogram using the set bins number
        #     hist, edges = np.histogram(
        #         np.array(values), density=self.density, bins=self.bins
        #     )
        #     self.set_and_get("hist", val, hist)
        #     self.set_and_get("edges", val, edges)
        #     self.set_and_get("left", val, edges[:-1])
        #     self.set_and_get("right", val, edges[1:])
        #     self.set_and_get("bottom", val, np.zeros(len(hist)))
        #
        #     self._mu_and_sigma = False
        #     if self.mu is not None and self.sigma is not None:
        #         if _is_scipy:
        #             self._mu_and_sigma = True
        #             self.set_and_get("x", val, np.linspace(-2, 2, len(self._data[val])))
        #             den = 2 * self.sigma ** 2
        #             x_val = self._data["x" + val]
        #             x_val_mu = x_val - self.mu
        #             sigsqr2pi = self.sigma * np.sqrt(2 * np.pi)
        #             pdf = 1 / (sigsqr2pi) * np.exp(-x_val_mu ** 2 / den)
        #             self.set_and_get("pdf", val, pdf)
        #             self._groups.append("pdf")
        #             cdf = (1 + scipy.special.erf(x_val_mu / np.sqrt(den))) / 2
        #             self.set_and_get("cdf", val, cdf)
        #             self._groups.append("cdf")
        #         else:
        #             print("You need scipy to get the theoretical probability distributions.")
        #pass

    # def _set_ranges(self):
    #     """Push the Histogram data into the ColumnDataSource and calculate
    #     the proper ranges."""
        # self._source = ColumnDataSource(data=self._data)
        #
        # if not self._mu_and_sigma:
        #     x_names, y_names = self._attr[2::6], self._attr[1::6]
        # else:
        #     x_names, y_names = self._attr[2::9], self._attr[1::9]
        #
        # endx = max(max(self._data[i]) for i in x_names)
        # startx = min(min(self._data[i]) for i in x_names)
        # self.x_range = Range1d(start=startx - 0.1 * (endx - startx),
        #                    end=endx + 0.1 * (endx - startx))
        #
        # endy = max(max(self._data[i]) for i in y_names)
        # self.y_range = Range1d(start=0, end=1.1 * endy)
        # pass

    # def _yield_renderers(self):
    #     """Use the several glyphs to display the Histogram and pdf/cdf.
    #
    #     It uses the quad (and line) glyphs to display the Histogram
    #     bars, taking as reference points the data loaded at the
    #     ColumnDataSurce.
    #     """
    #     if not self._mu_and_sigma:
    #         sextets = list(chunk(self._attr, 6))
    #         colors = cycle_colors(sextets, self.palette)
    #
    #         # TODO (bev) this is a perfect use for a namedtuple
    #         # sextet: values, his, edges, left, right, bottom
    #         for i, sextet in enumerate(sextets):
    #
    #             glyph = Quad(
    #                 top=sextet[1], bottom=sextet[5], left=sextet[3], right=sextet[4],
    #                 fill_color=colors[i], fill_alpha=0.7,
    #                 line_color="white", line_alpha=1.0
    #             )
    #             renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
    #             self.legends.append((self._groups[i], [renderer]))
    #             yield renderer
    #
    #     else:
    #         nonets = list(chunk(self._attr, 9))
    #         colors = cycle_colors(nonets, self.palette)
    #
    #         # TODO (bev) this is a perfect use for a namedtuple
    #         # nonet: values, his, edges, left, right, bottom, x, pdf, cdf
    #         for i, nonet in enumerate(nonets):
    #
    #             glyph = Quad(
    #                 top=nonet[1], bottom=nonet[5], left=nonet[3], right=nonet[4],
    #                 fill_color=colors[i], fill_alpha=0.7,
    #                 line_color="white", line_alpha=1.0
    #             )
    #             renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
    #             self.legends.append((self._groups[i], [renderer]))
    #             yield renderer
    #
    #             glyph = Line(x=nonet[6], y=nonet[7], line_color="black")
    #             yield GlyphRenderer(data_source=self._source, glyph=glyph)
    #
    #             glyph = Line(x=nonet[6], y=nonet[8], line_color="blue")
    #             yield GlyphRenderer(data_source=self._source, glyph=glyph)
