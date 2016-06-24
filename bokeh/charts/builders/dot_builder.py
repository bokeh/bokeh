"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Dot class which lets you build your Dot plots just passing
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
from ...core.properties import Bool, Float
from .bar_builder import BarBuilder
from ..glyphs import DotGlyph
from ..attributes import ColorAttr, CatAttr, MarkerAttr

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Dot(data, label=None, values=None, color=None, stack=None, group=None,
        agg="sum", xscale="categorical", yscale="linear", xgrid=False,
        ygrid=True, continuous_range=None, **kw):
    """ Create a Dot chart using
    :class:`DotBuilder <bokeh.charts.builders.dot_builder.DotBuilder>` to render the
    geometry from the inputs.

    Args:
        data (:ref:`userguide_charts_data_types`): the data
            source for the chart.
        label (list(str) or str, optional): list of string representing the categories.
            (Defaults to None)
        values (str, optional): iterable 2d representing the data series
            values matrix.
        color (str or list(str) or `~bokeh.charts._attributes.ColorAttr`): string color,
            string column name, list of string columns or a custom `ColorAttr`,
            which replaces the default `ColorAttr` for the builder.
        stack (list(str) or str, optional): columns to use for stacking.
            (Defaults to False, so grouping is assumed)
        group (list(str) or str, optional): columns to use for grouping.
        agg (str): how to aggregate the `values`. (Defaults to 'sum', or only label is
            provided, then performs a `count`)
        continuous_range(Range1d, optional): Custom continuous_range to be
            used. (Defaults to None)

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate dots

    Examples:

        .. bokeh-plot::
            :source-position: above

            from bokeh.charts import Dot, output_file, show
            from bokeh.layouts import row

            # best support is with data in a format that is table-like
            data = {
                'sample': ['1st', '2nd', '1st', '2nd', '1st', '2nd'],
                'interpreter': ['python', 'python', 'pypy', 'pypy', 'jython', 'jython'],
                'timing': [-2, 5, 12, 40, 22, 30]
            }

            # x-axis labels pulled from the interpreter column, stacking labels from sample column
            dot = Dot(data, values='timing', label='interpreter', stack='sample', agg='mean',
                      title="Python Interpreter Sampling", legend='top_right', plot_width=400)

            # table-like data results in reconfiguration of the chart with no data manipulation
            dot2 = Dot(data, values='timing', label=['interpreter', 'sample'],
                       agg='mean', title="Python Interpreters", plot_width=400)

            output_file("Dot.html")
            show(row(dot, dot2))

    """
    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )

    if label is not None and values is None:
        kw['label_only'] = True
        if (agg == 'sum') or (agg == 'mean'):
            agg = 'count'
            values = label

    # The continuous_range is the y_range (until we implement HDot charts)
    y_range = continuous_range
    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['stack'] = stack
    kw['group'] = group
    kw['agg'] = agg
    kw['xscale'] = xscale
    kw['yscale'] = yscale
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['y_range'] = y_range

    return create_and_build(DotBuilder, data, **kw)


class DotBuilder(BarBuilder):
    """Produces Dot Glyphs for groups of data.

    Handles dot plot options to produce one to many dots,
    which are used to describe the values of aggregated groups of data.

    """

    line_alpha = Float(default=1.0)

    # ToDo: Support easier adding of one attr without reimplementation
    default_attributes = {'label': CatAttr(),
                          'color': ColorAttr(),
                          'line_color': ColorAttr(),
                          'stack': CatAttr(),
                          'group': CatAttr(),
                          'marker': MarkerAttr(),
                          }

    stem = Bool(False, help="""
    Whether to draw a stem from each do to the axis.
    """)

    glyph = DotGlyph
