"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Step class which lets you build your Step charts just
passing the arguments to the Chart class and calling the proper functions.
"""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------
from __future__ import absolute_import

from ..builder import create_and_build
from .line_builder import LineBuilder
from ..glyphs import StepGlyph


# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------


def Step(data=None, x=None, y=None, **kws):
    """ Create a step chart using :class:`StepBuilder
    <bokeh.charts.builder.step_builder.StepBuilder>` to render the geometry
    from the inputs.

    .. note::
        Only the x or y axis can display multiple variables, while the other is used
        as an index.

    Args:
        data (list(list), numpy.ndarray, pandas.DataFrame, list(pd.Series)): a 2d data
            source with columns of data for each stepped line.
        x (str or list(str), optional): specifies variable(s) to use for x axis
        y (str or list(str), optional): specifies variable(s) to use for y axis

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    .. note::
        This chart type differs on input types as compared to other charts,
        due to the way that series-type charts typically are plotting labeled series.
        For example, a column for AAPL stock prices over time. Another way this could be
        plotted is to have a DataFrame with a column of `stock_label` and columns of
        `price`, which is the stacked format. Both should be supported, but the former
        is the expected one. Internally, the latter format is being derived.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the stepped lines

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import Step, show, output_file

        # build a dataset where multiple columns measure the same thing
        data = dict(
                   stamp=[.33, .33, .34, .37, .37, .37, .37, .39, .41, .42,
                          .44, .44, .44, .45, .46, .49, .49],
                   postcard=[.20, .20, .21, .23, .23, .23, .23, .24, .26, .27,
                             .28, .28, .29, .32, .33, .34, .35]
               )

        # create a step chart where each column of measures receives a unique color and dash style
        step = Step(data, y=['stamp', 'postcard'],
                    dash=['stamp', 'postcard'],
                    color=['stamp', 'postcard'],
                    title="U.S. Postage Rates (1999-2015)",
                    ylabel='Rate per ounce', legend=True)

        output_file("steps.html")

        show(step)

    """
    kws['x'] = x
    kws['y'] = y
    return create_and_build(StepBuilder, data, **kws)


class StepBuilder(LineBuilder):
    """This is the Step builder and it is in charge of plotting
    Step charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.

    We additionally make calculations for the ranges, and finally add the
    needed stepped lines taking the references from the source.

    """

    def yield_renderers(self):
        for group in self._data.groupby(**self.attributes):
            glyph = StepGlyph(x=group.get_values(self.x.selection),
                              y=group.get_values(self.y.selection),
                              line_color=group['color'],
                              dash=group['dash'])

            # save reference to composite glyph
            self.add_glyph(group, glyph)

            # yield each renderer produced by composite glyph
            for renderer in glyph.renderers:
                yield renderer
