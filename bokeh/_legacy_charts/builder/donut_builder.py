"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Donut class which lets you build your Donut charts just passing
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
from __future__ import absolute_import, division
from math import pi
import pandas as pd

from ..utils import cycle_colors, polar_to_cartesian
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, GlyphRenderer, Range1d
from ...models.glyphs import AnnularWedge, Text, Wedge
from ...properties import Any, Bool, Either, List

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Donut(values,  cat=None, width=800, height=800, xgrid=False, ygrid=False, **kws):
    """ Creates a Donut chart using  :class:`DonutBuilder <bokeh.charts.builder.donut_builder.DonutBuilder>`
    to render the geometry from values and cat.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        cat (list or bool, optional): list of string representing the categories.
            Defaults to None.

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import Donut, output_file, show

        # dict, OrderedDict, lists, arrays and DataFrames are valid inputs
        xyvalues = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]

        donut = Donut(xyvalues, ['cpu1', 'cpu2', 'cpu3'])

        output_file('donut.html')
        show(donut)

    """
    return create_and_build(
        DonutBuilder, values, cat=cat, width=width, height=height,
        xgrid=xgrid, ygrid=ygrid, **kws
    )


class DonutBuilder(Builder):
    """This is the Donut class and it is in charge of plotting
    Donut chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the donut slices and angles.
    And finally add the needed glyphs (Wedges and AnnularWedges) taking
    the references from the source.

    """

    cat = Either(Bool, List(Any), help="""
    List of string representing the categories. (Defaults to None.)
    """)

    def _process_data(self):
        """Take the chart data from self._values.

        It calculates the chart properties accordingly (start/end angles).
        Then build a dict containing references to all the calculated
        points to be used by the Wedge glyph inside the ``_yield_renderers`` method.

        """
        dd = dict(zip(self._values.keys(), self._values.values()))
        self._df = df = pd.DataFrame(dd)
        self._groups = df.index = self.cat
        df.columns = self._values.keys()

        # Get the sum per category
        aggregated = df.T.sum()
        # Get the total (sum of all categories)
        self._total_units = total = aggregated.sum()
        radians = lambda x: 2*pi*(x/total)
        angles = aggregated.map(radians).cumsum()
        end_angles = angles.tolist()
        start_angles = [0] + end_angles[:-1]
        colors = cycle_colors(self.cat, self.palette)
        self.set_and_get("", "colors", colors)
        self.set_and_get("", "end", end_angles)
        self.set_and_get("", "start", start_angles)

    def _set_sources(self):
        """Push the Donut data into the ColumnDataSource and calculate
         the proper ranges.

        """
        self._source = ColumnDataSource(self._data)
        self.x_range = Range1d(start=-2, end=2)
        self.y_range = Range1d(start=-2, end=2)

    def draw_central_wedge(self):
        """Draw the central part of the donut wedge from donut.source and
         its calculated start and end angles.

        """
        glyph = Wedge(
            x=0, y=0, radius=1, start_angle="start", end_angle="end",
            line_color="white", line_width=2, fill_color="colors"
        )
        yield GlyphRenderer(data_source=self._source, glyph=glyph)

    def draw_central_descriptions(self):
        """Draw the descriptions to be placed on the central part of the
        donut wedge
        """
        text = ["%s" % cat for cat in self.cat]
        x, y = polar_to_cartesian(0.7, self._data["start"], self._data["end"])
        text_source = ColumnDataSource(dict(text=text, x=x, y=y))
        glyph = Text(
                x="x", y="y", text="text",
                text_align="center", text_baseline="middle"
            )
        yield GlyphRenderer(data_source=text_source, glyph=glyph)

    def draw_external_ring(self, colors=None):
        """Draw the external part of the donut wedge from donut.source
         and its related descriptions
        """
        if colors is None:
            colors = cycle_colors(self.cat, self.palette)

        first = True
        for i, (cat, start_angle, end_angle) in enumerate(zip(
                self.cat, self._data['start'], self._data['end'])):
            details = self._df.ix[i]
            radians = lambda x: 2*pi*(x/self._total_units)

            angles = details.map(radians).cumsum() + start_angle
            end = angles.tolist() + [end_angle]
            start = [start_angle] + end[:-1]
            base_color = colors[i]
            fill = [base_color for i in start]
            text = [rowlabel for rowlabel in details.index]
            x, y = polar_to_cartesian(1.25, start, end)

            source = ColumnDataSource(dict(start=start, end=end, fill=fill))

            glyph = AnnularWedge(
                x=0, y=0, inner_radius=1, outer_radius=1.5,
                start_angle="start", end_angle="end",
                line_color="white", line_width=2,
                fill_color="fill"
            )
            yield GlyphRenderer(data_source=source, glyph=glyph)

            text_angle = [(start[i]+end[i])/2 for i in range(len(start))]
            text_angle = [angle + pi if pi/2 < angle < 3*pi/2 else angle
                          for angle in text_angle]

            if first and text:
                text.insert(0, '')
                offset = pi / 48
                text_angle.insert(0, text_angle[0] - offset)
                start.insert(0, start[0] - offset)
                end.insert(0, end[0] - offset)
                fill.insert(0, base_color)
                x, y = polar_to_cartesian(1.25, start, end)
                first = False

            for i in range(len(text_angle)-len(text)):
                text.append('')

            data = dict(text=text, x=x, y=y, angle=text_angle)
            text_source = ColumnDataSource(data)
            glyph = Text(
                x="x", y="y", text="text", angle="angle",
                text_align="center", text_baseline="middle"
            )
            yield GlyphRenderer(data_source=text_source, glyph=glyph)

    def _yield_renderers(self):
        """Use the AnnularWedge and Wedge glyphs to display the wedges.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        # build the central round area of the donut
        renderers = []
        renderers += self.draw_central_wedge()
        # write central descriptions
        renderers += self.draw_central_descriptions()
        # build external donut ring
        renderers += self.draw_external_ring()
        return renderers
