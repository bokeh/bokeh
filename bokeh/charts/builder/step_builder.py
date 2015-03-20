"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Step class which lets you build your Step charts just
passing the arguments to the Chart class and calling the proper functions.
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
from six import string_types

from ..utils import cycle_colors
from .._builder import create_and_build, Builder
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer
from ...models.glyphs import Line
from warnings import warn

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Step(values, index=None, **kws):
    """ Create a step chart using :class:`StepBuilder <bokeh.charts.builder.step_builder.StepBuilder>`
    render the geometry from values and index.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        from bokeh.charts import Step, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = [[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]]

        step = Step(xyvalues, title="Steps", legend="top_left", ylabel='Languages')

        output_file('step.html')
        show(step)

    """
    if index is not None:
        msg = "bokeh.charts.Line index argument is deprecated since Bokeh 0.8.2. Use x_names instead!"
        warn(msg, DeprecationWarning, stacklevel=2)
        kws['x_names'] = index

    return create_and_build(StepBuilder, values, **kws)


class StepBuilder(Builder):
    """This is the Step class and it is in charge of plotting
    Step charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the
    source.

    """

    def _process_data(self):
        """It calculates the chart properties accordingly from Step.values.
        Then build a dict containing references to all the points to be
        used by the segment glyph inside the ``_yield_renderers`` method.
        """
        # step needs a "custom" x to draw the stepped lines so we need
        # a new series from the original data to "build" the steps
        orig_xs = self._values_index
        xs = np.empty(2*len(orig_xs)-1, dtype=np.int)
        xs[::2] = orig_xs[:]
        xs[1::2] = orig_xs[1:]
        self._data['step_x'] = xs

        for col, values in self._values.items():
            # like we did with the x values, we need to do the same with
            # the series selected with the "y_names" attribute.
            if col in self.y_names:
                orig_ys = np.asarray(values)
                ys = np.empty(2*len(orig_ys)-1)
                ys[::2] = orig_ys[:]
                ys[1::2] = orig_ys[:-1]
                self._data['step_%s' % col] = ys

            # add the original series to _data so it can be found in source
            # and can also be used for tooltips..
            if not col in self._data:
                self._data[col] = orig_ys

    def _set_ranges(self):
        """ Calculate the proper ranges.
        """
        self.x_range = DataRange1d(sources=[self.source.columns("step_x")])
        y_sources = [self.source.columns("step_%s" % col) for col in self.y_names]
        self.y_range = DataRange1d(sources=y_sources)

    def _yield_renderers(self):
        """Use the line glyphs to connect the xy points in the Step.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self.y_names, self.palette)
        for color, name in zip(colors, self.y_names):
            # draw the step horizontal segment
            glyph = Line(x="step_x", y="step_%s" % name, line_color=color, line_width=1)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((name, [renderer]))
            yield renderer
