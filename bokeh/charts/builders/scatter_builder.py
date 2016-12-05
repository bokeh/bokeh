"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Scatter class which lets you build your Scatter charts
just passing the arguments to the Chart class and calling the proper
functions.
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

from bokeh.charts.builder import create_and_build, XYBuilder
from bokeh.charts.glyphs import PointGlyph
from bokeh.charts.attributes import MarkerAttr, ColorAttr
from bokeh.charts.utils import add_tooltips_columns


#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Scatter(data=None, x=None, y=None, **kws):
    """ Create a scatter chart using :class:`ScatterBuilder <bokeh.charts.builders.scatter_builder.ScatterBuilder>`
    to render the geometry from values.

    Args:
        data (:ref:`userguide_charts_data_types`): table-like data
        x (str or list(str), optional): the column label to use for the x dimension
        y (str or list(str), optional): the column label to use for the y dimension

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the scatter points

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.sampledata.autompg import autompg as df
        from bokeh.charts import Scatter, output_file, show

        scatter = Scatter(df, x='mpg', y='hp', color='cyl', marker='origin',
                          title="Auto MPG", xlabel="Miles Per Gallon",
                          ylabel="Horsepower")

        output_file('scatter.html')
        show(scatter)

    """
    kws['x'] = x
    kws['y'] = y
    return create_and_build(ScatterBuilder, data, **kws)


class ScatterBuilder(XYBuilder):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    default_attributes = {'color': ColorAttr(),
                          'marker': MarkerAttr()}

    def yield_renderers(self):
        """Use the marker glyphs to display the points.

        Takes reference points from data loaded at the ColumnDataSource.
        """

        for group in self._data.groupby(**self.attributes):

            glyph = PointGlyph(label=group.label,
                               x=group.get_values(self.x.selection),
                               y=group.get_values(self.y.selection),
                               line_color=group['color'],
                               fill_color=group['color'],
                               marker=group['marker'])

            self.add_glyph(group, glyph)

            for renderer in glyph.renderers:

                if self.tooltips:
                    renderer = add_tooltips_columns(renderer, self.tooltips, group)

                yield renderer
