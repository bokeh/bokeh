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

from ..utils import make_scatter
from .._builder import DistributionBuilder, create_and_build
from ...models import FactorRange, GlyphRenderer, DataRange1d
from ...models.glyphs import Rect, Segment
from ...models.sources import ColumnDataSource
from ...properties import Bool, String

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class ChartBoxGlyph(object):

    def __init__(self, source, cat, marker='circle', color='black', width=0.8, outliers=True, **kws):
        self.legend_label = cat
        self.color = color
        self.marker = marker
        self.outliers = outliers
        self.main_source = source

        values = source.data[cat]
        data = {'cat': cat}


        # add group to the data_segment dict
        data["width"] = [width, width]
        # all the list we are going to use to save calculated values
        data["q0"] = q0_points = []
        data["q2"] = q2_points = []
        data["iqr_centers"] = iqr_centers = []
        data["iqr_lengths"] = iqr_lengths = []
        data["lower"] = lower_points = []
        data["upper"] = upper_points = []
        data["out_x"] = out_x = []
        data["out_y"] = out_y = []
        data["out_colors"] = out_colors = []
        data["colors"] = [color, color]


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
        data["rect_center"] = [(q[2] + q[1]) / 2, (q[1] + q[0]) / 2]
        data["rect_height"] =[q[2] - q[1], q[1] - q[0]]
        data["cat"] = [cat, cat]


        
        # Store indices of outliers as list
        outliers = np.where(
            (values > upper) | (values < lower)
        )[0]
        for out in outliers:
            o = values[out]
            out_x.append(cat)
            out_y.append(o)
            out_colors.append(color)

        self.source = ColumnDataSource(data)
        self.boxes_source = ColumnDataSource({x: data[x] for x in ['rect_center', 'rect_height', 'width', 'cat', 'colors']})

        self._create_renderers()


    def _create_renderers(self):
        self._renderers = []
        # Draw the lower and upper segments
        for (y0, y1) in [('lower', 'q0'), ('q2', 'upper')]:
            glyph = Segment(
                x0="cat", y0=y0,
                x1="cat", y1=y1,
                line_color="black", line_width=2
            )

            self._renderers.append(GlyphRenderer(data_source=self.source, glyph=glyph))

        # Draw the boxes
        glyph = Rect(x="cat", y='iqr_centers', width="width",
                     height='iqr_lengths', line_color="black", line_width=2,
                     fill_color=None)
        renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
        self._renderers.append(renderer)

        # for color, y_name in zip(self.palette, self.y):
        glyph = Rect(
            x="cat", y="rect_center",
            width="width", height="rect_height",
            line_color="black",
            line_width=1,
            fill_color='colors',
        )
        renderer = GlyphRenderer(data_source=self.boxes_source, glyph=glyph)

        # need to manually select the proper glyphs to be rendered as legends
        self._legend = (self.legend_label, [renderer])
        self._renderers.append(renderer)

        # Draw the outliers if needed
        if self.outliers:
            glyph = make_scatter(self.source, 'out_x', 'out_y', self.marker, 'out_colors')
            self._renderers.append(GlyphRenderer(data_source=self.source, glyph=glyph))

    @property
    def renderers(self):
        return self._renderers

    @property
    def legend(self):
        return self._legend
        return self.legend_label, [self.renderer]


def BoxPlot(values, categories=None, marker="circle", outliers=True, xscale="categorical",
            yscale="linear", xgrid=False, ygrid=True, **kw):
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
        BoxPlotBuilder, values, categories=categories, marker=marker, outliers=outliers,
        xscale=xscale, yscale=yscale, xgrid=xgrid, ygrid=ygrid, **kw
    )

class BoxPlotBuilder(DistributionBuilder):
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

    def _create_glyph(self, cat, color):
        return ChartBoxGlyph(self.source, cat, marker=self.marker, color=color)
