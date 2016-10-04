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

from ..builder import create_and_build
from ...models import Range1d
from ...core.properties import Bool, String
from .bar_builder import BarBuilder
from ..glyphs import BoxGlyph
from ..utils import title_from_columns
from ..attributes import ColorAttr, CatAttr

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def BoxPlot(data, label=None, values=None, color=None, group=None,
            xscale="categorical", yscale="linear", xgrid=False,
            ygrid=True, continuous_range=None, **kw):
    """Create a BoxPlot chart containing one or more boxes from table-like data.

    Create a boxplot chart using :class:`BoxPlotBuilder
    <bokeh.charts.builders.boxplot_builder.BoxPlotBuilder>` to render the
    glyphs from input data and specification. This primary use case for the
    boxplot is to depict the distribution of a variable by providing summary
    statistics for it. This boxplot is particularly useful at comparing
    distributions between categorical variables.

    This chart implements functionality for segmenting and comparing the values
    of a variable by an associated categorical variable.

    Reference: `BoxPlot on Wikipedia <https://en.wikipedia.org/wiki/Box_plot>`_

    Args:
        data (:ref:`userguide_charts_data_types`): the data source for the chart
        values (str, optional): the values to use for producing the boxplot using
            table-like input data
        label (str or list(str), optional): the categorical variable to use for creating
            separate boxes
        color (str or list(str) or bokeh.charts._attributes.ColorAttr, optional): the
            categorical variable or color attribute specification to use for coloring the
            boxes.
        whisker_color (str or list(str) or bokeh.charts._attributes.ColorAttr, optional): the
            color of the "whiskers" that show the spread of values outside the .25 and .75
            quartiles.
        marker (str or list(str) or bokeh.charts._attributes.MarkerAttr, optional): the
            marker glyph to use for the outliers
        outliers (bool, optional): whether to show outliers. Defaults to True.
        **kw:

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate Boxes and Whiskers

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import BoxPlot, output_file, show
        from bokeh.layouts import row
        from bokeh.sampledata.autompg import autompg as df

        box = BoxPlot(df, values='mpg', label='cyl', title="Auto MPG Box Plot", plot_width=400)
        box2 = BoxPlot(df, values='mpg', label='cyl', color='cyl',
                       title="MPG Box Plot by Cylinder Count", plot_width=400)

        output_file('box.html')
        show(row(box, box2))

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
    kw['group'] = group
    kw['xscale'] = xscale
    kw['yscale'] = yscale
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['y_range'] = y_range

    return create_and_build(BoxPlotBuilder, data, **kw)


class BoxPlotBuilder(BarBuilder):
    """Produces Box Glyphs for groups of data.

    Handles box plot options to produce one to many boxes,
    which are used to describe the distribution of a variable.

    """

    # ToDo: Support easier adding of one attr without reimplementation
    default_attributes = {'label': CatAttr(),
                          'color': ColorAttr(default='DimGrey'),
                          'outlier_fill_color': ColorAttr(default='red'),
                          'outlier_line_color': ColorAttr(default='red'),
                          'whisker_color': ColorAttr(default='black'),
                          'line_color': ColorAttr(default='black'),
                          'stack': CatAttr(),
                          'group': CatAttr()}

    # TODO: (bev) should be an enumeration
    marker = String(help="""
    The marker type to use (e.g., ``circle``) if outliers=True.
    """)

    outliers = Bool(default=True, help="""
    Whether to display markers for any outliers.
    """)

    glyph = BoxGlyph

    def setup(self):
        if self.ylabel is None:
            self.ylabel = self.values.selected_title

        if self.xlabel is None:
            self.xlabel = title_from_columns(self.attributes['label'].columns)
