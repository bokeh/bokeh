"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.
This is the Line class which lets you build your Line charts just
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
from .._builder import TabularSourceBuilder, create_and_build
from ...models.glyphs import Line as LineGlyph
from ...models import GlyphRenderer, ColumnDataSource

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

class ChartLineGlyph(object):

    def __init__(self, source, x, y, **kws):
        self.main_source = source
        self.source = ColumnDataSource(data=source.data)
        source.tags = [y]

        self.glyph = LineGlyph(x=x, y=y, **kws)
        self.renderer = GlyphRenderer(data_source=self.source, glyph=self.glyph)

        self.legend_label = y

    def create_legend(self):
        return (self.legend_label, [self.renderer])

def Line(values, index=None, **kws):
    """ Create a line chart using :class:`LineBuilder <bokeh.charts.builder.line_builder.LineBuilder>` to
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
        import numpy as np
        from bokeh.charts import Line, output_file, show
        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = np.array([[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]])
        line = Line(xyvalues, title="line", legend="top_left", ylabel='Languages')
        output_file('line.html')
        show(line)
    """
    return create_and_build(LineBuilder, values,  **kws)


class LineBuilder(TabularSourceBuilder):
    """This is the Line class and it is in charge of plotting
    Line charts in an easy and intuitive way.
    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.
    """

    def _create_glyph(self, xname, yname, color):
        return ChartLineGlyph(self.source, x=xname, y=yname, line_color=color)
        # glyph = LineGlyph(x=xname, y=yname, line_color=color)
        # renderer = GlyphRenderer(data_source=source, glyph=glyph)
        #
        # # TODO: This is a problem for complex Higher Level Glyphs.
        # # Better to let those have their own "legend" creator method?
        # self._legends.append((yname, [renderer]))
        #
        # return renderer