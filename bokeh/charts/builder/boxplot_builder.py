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

from ..utils import make_scatter, cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
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
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

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
        self._data_segment = dict()
        self._attr_segment = []
        self._data_rect = dict()
        self._attr_rect = []
        self._data_scatter = dict()
        self._attr_scatter = []
        self._data_legend = dict()

        if isinstance(self._values, pd.DataFrame):
            self._groups = self._values.columns
        else:
            self._groups = list(self._values.keys())

        # add group to the self._data_segment dict
        self._data_segment["groups"] = self._groups

        # add group and witdh to the self._data_rect dict
        self._data_rect["groups"] = self._groups
        self._data_rect["width"] = [0.8] * len(self._groups)

        # self._data_scatter does not need references to groups now,
        # they will be added later.
        # add group to the self._data_legend dict
        self._data_legend["groups"] = self._groups

        # all the list we are going to use to save calculated values
        q0_points = []
        q2_points = []
        iqr_centers = []
        iqr_lengths = []
        lower_points = []
        upper_points = []
        upper_center_boxes = []
        upper_height_boxes = []
        lower_center_boxes = []
        lower_height_boxes = []
        out_x, out_y, out_color = ([], [], [])
        colors = cycle_colors(self._groups, self.palette)

        for i, (level, values) in enumerate(self._values.items()):
            # Compute quantiles, center points, heights, IQR, etc.
            # quantiles
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
                out_color.append(colors[i])

        # Store
        self.set_and_get(self._data_scatter, self._attr_scatter, "out_x", out_x)
        self.set_and_get(self._data_scatter, self._attr_scatter, "out_y", out_y)
        self.set_and_get(self._data_scatter, self._attr_scatter, "colors", out_color)

        self.set_and_get(self._data_segment, self._attr_segment, "q0", q0_points)
        self.set_and_get(self._data_segment, self._attr_segment, "lower", lower_points)
        self.set_and_get(self._data_segment, self._attr_segment, "q2", q2_points)
        self.set_and_get(self._data_segment, self._attr_segment, "upper", upper_points)

        self.set_and_get(self._data_rect, self._attr_rect, "iqr_centers", iqr_centers)
        self.set_and_get(self._data_rect, self._attr_rect, "iqr_lengths", iqr_lengths)
        self.set_and_get(self._data_rect, self._attr_rect, "upper_center_boxes", upper_center_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "upper_height_boxes", upper_height_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "lower_center_boxes", lower_center_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "lower_height_boxes", lower_height_boxes)
        self.set_and_get(self._data_rect, self._attr_rect, "colors", colors)

    def _set_sources(self):
        "Push the BoxPlot data into the ColumnDataSource and calculate the proper ranges."
        self._source_segment = ColumnDataSource(self._data_segment)
        self._source_scatter = ColumnDataSource(self._data_scatter)
        self._source_rect = ColumnDataSource(self._data_rect)
        self._source_legend = ColumnDataSource(self._data_legend)
        self.x_range = FactorRange(factors=self._source_segment.data["groups"])

        start_y = min(self._data_segment[self._attr_segment[1]])
        end_y = max(self._data_segment[self._attr_segment[3]])

        ## Expand min/max to encompass outliers
        if self.outliers and self._data_scatter[self._attr_scatter[1]]:
            start_out_y = min(self._data_scatter[self._attr_scatter[1]])
            end_out_y = max(self._data_scatter[self._attr_scatter[1]])
            # it could be no outliers in some sides...
            start_y = min(start_y, start_out_y)
            end_y = max(end_y, end_out_y)
        self.y_range = Range1d(start=start_y - 0.1 * (end_y - start_y),
                           end=end_y + 0.1 * (end_y - start_y))

    def _yield_renderers(self):
        """Use the several glyphs to display the Boxplot.

        It uses the selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        ats = self._attr_segment

        glyph = Segment(
            x0="groups", y0=ats[1], x1="groups", y1=ats[0],
            line_color="black", line_width=2
        )
        yield GlyphRenderer(data_source=self._source_segment, glyph=glyph)

        glyph = Segment(
            x0="groups", y0=ats[2], x1="groups", y1=ats[3],
            line_color="black", line_width=2
        )
        yield GlyphRenderer(data_source=self._source_segment, glyph=glyph)

        atr = self._attr_rect

        glyph = Rect(
            x="groups", y=atr[0], width="width", height=atr[1],
            line_color="black", line_width=2, fill_color=None,
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        glyph = Rect(
            x="groups", y=atr[2], width="width", height=atr[3],
            line_color="black", fill_color=atr[6],
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        glyph = Rect(
            x="groups", y=atr[4], width="width", height=atr[5],
            line_color="black", fill_color=atr[6],
        )
        yield GlyphRenderer(data_source=self._source_rect, glyph=glyph)

        if self.outliers:
            yield make_scatter(self._source_scatter, self._attr_scatter[0],
                              self._attr_scatter[1], self.marker,
                              self._attr_scatter[2])

    # Some helper methods
    def set_and_get(self, data, attr, val, content):
        """Set a new attr and then get it to fill the self._data dict.

        Keep track of the attributes created.

        Args:
            data (dict): where to store the new attribute content
            attr (list): where to store the new attribute names
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        self._set_and_get(data, "", attr, val, content)
