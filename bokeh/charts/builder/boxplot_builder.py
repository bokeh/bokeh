"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the BoxPlot class which lets you build your BoxPlot plots just passing
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

from __future__ import absolute_import

import numpy as np
import pandas as pd

from ..utils import make_scatter
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d, DataRange1d
from ...models.glyphs import Rect, Segment
from ...properties import Bool, String

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def BoxPlot(values, marker="circle", outliers=True, xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, **kw):
    """ Create a BoxPlot chart using :class:`BoxPlotBuilder <bokeh.charts.builder.boxplot_builder.BoxPlotBuilder>`
    to render the geometry from values, marker and outliers arguments.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        marker (int or string, optional): if outliers=True, the marker type to use
            e.g., `circle`.
        outliers (bool, optional): Whether or not to plot outliers.

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        import numpy as np
        from bokeh.charts import BoxPlot, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames of arrays are valid inputs)
        medals = dict([
            ('bronze', np.array([7.0, 10.0, 8.0, 7.0, 4.0, 4.0, 1.0, 5.0, 2.0, 1.0,
                        4.0, 2.0, 1.0, 2.0, 4.0, 1.0, 0.0, 1.0, 1.0, 2.0,
                        0.0, 1.0, 0.0, 0.0, 1.0, 1.0])),
            ('silver', np.array([8., 4., 6., 4., 8., 3., 3., 2., 5., 6.,
                        1., 4., 2., 3., 2., 0., 0., 1., 2., 1.,
                        3.,  0.,  0.,  1.,  0.,  0.])),
            ('gold', np.array([6., 6., 6., 8., 4., 8., 6., 3., 2., 2.,  2.,  1.,
                      3., 1., 0., 5., 4., 2., 0., 0., 0., 1., 1., 0., 0.,
                      0.]))
        ])

        boxplot = BoxPlot(medals, marker="circle", outliers=True, title="boxplot",
            xlabel="medal type", ylabel="medal count")

        output_file('boxplot.html')
        show(boxplot)

    """
    return create_and_build(
        BoxPlotBuilder, values, marker=marker, outliers=outliers,
        xscale=xscale, yscale=yscale, xgrid=xgrid, ygrid=ygrid, **kw
    )

class BoxPlotBuilder(Builder):
    """This is the BoxPlot class and it is in charge of plotting
    scatter plots in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects, lines and markers)
    taking the references from the source.

    """

    # TODO: (bev) should be an enumeration
    marker = String(help="""
    The marker type to use (e.g., ``circle``) if outliers=True.
    """)

    outliers = Bool(help="""
    Whether to display markers for any outliers.
    """)

    def _process_data(self):
        """Take the BoxPlot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the quad, segments and markers glyphs inside the ``_yield_renderers`` method.

        Args:
            cat (list): categories as a list of strings.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., ``circle``.
            outliers (bool, optional): Whether to plot outliers.
            values (dict or pd obj): the values to be plotted as bars.
        """

        if isinstance(self._values, pd.DataFrame):
            self._groups = [x for x in self._values.columns if x in self.y_names]
        else:
            self._groups = [x for x in list(self._values.keys()) if x in self.y_names]

        # add group to the self._data_segment dict
        self._data["groups"] = self._groups
        # add group and witdh to the self._data_rect dict
        self._data["width"] = [0.8] * len(self._groups)
        # all the list we are going to use to save calculated values
        self._data["q0"] = q0_points = []
        self._data["q2"] = q2_points = []
        self._data["iqr_centers"] = iqr_centers = []
        self._data["iqr_lengths"] = iqr_lengths = []
        self._data["lower"] = lower_points = []
        self._data["upper"] = upper_points = []
        self._data["upper_center_boxes"] = upper_center_boxes = []
        self._data["upper_height_boxes"] = upper_height_boxes = []
        self._data["lower_center_boxes"] = lower_center_boxes = []
        self._data["lower_height_boxes"] = lower_height_boxes = []
        self._data["out_x"] = out_x = []
        self._data["out_y"] = out_y = []
        self._data["out_colors"] = out_colors = []
        self._data["colors"] = self.palette

        for i, (level, values) in enumerate(self._values.items()):
            # Compute quantiles, center points, heights, IQR, etc.
            # quantiles

            if level in self.y_names:
                q = np.percentile(values, [25, 50, 75])
                q0_points.append(q[0])
                q2_points.append(q[2])

                # IQR related stuff...
                iqr_centers.append((q[2] + q[0]) / 2)
                iqr = q[2] - q[0]
                iqr_lengths.append(iqr)
                lower = q[0] - 1.5 * iqr
                upper = q[2] + 1.5 * iqr
                lower_points.append(lower)
                upper_points.append(upper)

                # rect center points and heights
                upper_center_boxes.append((q[2] + q[1]) / 2)
                upper_height_boxes.append(q[2] - q[1])
                lower_center_boxes.append((q[1] + q[0]) / 2)
                lower_height_boxes.append(q[1] - q[0])

                # Store indices of outliers as list
                outliers = np.where(
                    (values > upper) | (values < lower)
                )[0]
                for out in outliers:
                    o = values[out]
                    out_x.append(level)
                    out_y.append(o)
                    out_colors.append(self.palette[i])


    def _set_ranges(self):
        " Calculate the proper ranges."
        self.x_range = FactorRange(factors=self._groups)
        y_sources = map(self.source.columns, ["lower", "upper", "out_y"])
        self.y_range = DataRange1d(sources=y_sources)

    def _yield_renderers(self):
        """Use the several glyphs to display the Boxplot.

        It uses the selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        # Draw the lower and upper segments
        for (y0, y1) in [('lower', 'q0'), ('q2', 'upper')]:
            glyph = Segment(
                x0="groups", y0=y0, x1="groups", y1=y1, line_color="black",
                line_width=2
            )
            yield GlyphRenderer(data_source=self.source, glyph=glyph)

        # Draw the boxes
        rects_bound = [
            ('iqr_centers', 'iqr_lengths', None, 2),
            ('upper_center_boxes', 'upper_height_boxes', 'colors', 1),
            ('lower_center_boxes', 'lower_height_boxes', 'colors', 1)
        ]
        for (y0, y1, color, lw) in rects_bound:
            glyph = Rect(
                x="groups", y=y0, width="width", height=y1,
                line_color="black", line_width=lw, fill_color=color,
            )
            yield GlyphRenderer(data_source=self.source, glyph=glyph)

        # Draw the outliers if needed
        if self.outliers:
            glyph = make_scatter(
                self.source, 'out_x', 'out_y', self.marker, 'out_colors'
            )
            yield GlyphRenderer(data_source=self.source, glyph=glyph)

        # We need to build the legend here using dummy glyphs
        for i, level in enumerate(self._groups):
            # TODO: (bev) what is this None business?
            glyph = Rect(
                x="groups", y=None,
                width=None, height=None,
                line_color="black", fill_color=self.palette[i])
            renderer = GlyphRenderer(data_source=self.source, glyph=glyph)

            # need to manually select the proper glyphs to be rendered as legends
            self._legends.append((self._groups[i], [renderer]))
