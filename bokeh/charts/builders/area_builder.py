"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Area builder which lets you build your Area charts
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

from bokeh.charts.builder import create_and_build
from bokeh.charts.glyphs import AreaGlyph
from .line_builder import LineBuilder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Area(data=None, x=None, y=None, **kws):
    """ Create an area chart using :class:`AreaBuilder
    <bokeh.charts.builders.area_builder.AreaBuilder>` to render the
    geometry from values.

    Args:
        data (:ref:`userguide_charts_data_types`): table-like data
        x (str or list(str), optional): the column label to use for the x dimension
        y (str or list(str), optional): the column label to use for the y dimension

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the area glyphs

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import Area, show, output_file

        # create some example data
        data = dict(
            python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
            pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
            jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
        )

        area = Area(data, title="Area Chart", legend="top_left",
                    xlabel='time', ylabel='memory')

        output_file('area.html')
        show(area)

    """
    kws['x'] = x
    kws['y'] = y
    return create_and_build(AreaBuilder, data, **kws)


class AreaBuilder(LineBuilder):
    """This is the Area builder and it is in charge of generating
    glyph renderers that together produce an area chart.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    glyph = AreaGlyph
