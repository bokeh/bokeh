"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Chord class which lets you build your Chord charts
just passing the arguments to the Chart class and calling the proper
functions.
"""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2016, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------
from __future__ import absolute_import, division

import numpy as np
import pandas as pd
from math import cos, sin, pi
from bokeh.charts.properties import Dimension
from bokeh.charts.builder import create_and_build, Builder
from bokeh.charts.attributes import MarkerAttr, ColorAttr, CatAttr
from bokeh.charts.utils import color_in_equal_space, help
from bokeh.models import Range1d
from bokeh.models.glyphs import Arc, Bezier, Text
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.sources import ColumnDataSource
from bokeh.core.properties import Instance, Bool, String, Array, Float, Any, Seq, Either, Int


# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------

class Area:
    """ It represents an arc area. It will create a list of available points through the arc representing that area and
    then those points will be used as start and end for the beziers lines.
    """

    def __init__(self, n_conn, start_point, end_point):
        # Number of connections in that arc area
        self.n_conn = n_conn
        # The start point of the arc representing the area
        self.start_point = start_point
        self.end_point = end_point
        # Equally spaced points between start point and end point
        free_points_angles = np.linspace(start_point, end_point, n_conn)
        # A list of available X,Y in the chart to consume by each bezier's start and end point
        self.free_points = [[cos(angle), sin(angle)] for angle in free_points_angles]
        assert self.n_conn == len(self.free_points)


class ChordBuilder(Builder):
    """ This is the Chord builder and it is in charge of plotting
    Chord graphs in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    default_attributes = {'color': ColorAttr(),
                          'marker': MarkerAttr(),
                          'stack': CatAttr()}

    dimensions = ['values']

    values = Dimension('values')

    arcs_data = Instance(ColumnDataSource)
    text_data = Instance(ColumnDataSource)
    connection_data = Instance(ColumnDataSource)

    origin = String()
    destination = String()
    value = Any()
    square_matrix = Bool()
    label = Seq(Any())
    matrix = Array(Array(Either(Float(), Int())))

    def set_ranges(self):
        rng = 1.1 if not self.label else 1.8
        self.x_range = Range1d(-rng, rng)
        self.y_range = Range1d(-rng, rng)

    def setup(self):

        # Process only if not a square_matrix
        if not self.square_matrix:
            source = self.values._data[self.origin]
            target = self.values._data[self.destination]
            union = source.append(target).unique()
            N = union.shape[0]
            m = pd.DataFrame(np.zeros((N, N)), columns=union, index=union)

            if not self.label:
                self.label = list(union)

            if self.value is None:
                for _, row in self.values._data.iterrows():
                    m[row[self.origin]][row[self.destination]] += 1
                self.matrix = m.get_values()

            if self.value is not None:

                if isinstance(self.value, int) or isinstance(self.value, float):
                    for _, row in self.values._data.iterrows():
                        m[row[self.origin]][row[self.destination]] = self.value
                    self.matrix = m.get_values()

                elif isinstance(self.value, str):
                    for _, row in self.values._data.iterrows():
                        m[row[self.origin]][row[self.destination]] = row[self.value]
                    self.matrix = m.get_values().T
        else:
            # It's already a square matrix
            self.matrix = self._data.df.get_values()

        if self.label:
            assert len(self.label) == self.matrix.shape[0]

    def process_data(self):

        weights_of_areas = (self.matrix.sum(axis=0) + self.matrix.sum(axis=1)) - self.matrix.diagonal()
        areas_in_radians = (weights_of_areas / weights_of_areas.sum()) * (2 * pi)

        # We add a zero in the begging for the cumulative sum
        points = np.zeros((areas_in_radians.shape[0] + 1))
        points[1:] = areas_in_radians
        points = points.cumsum()

        colors = [color_in_equal_space(area / areas_in_radians.shape[0]) for area in range(areas_in_radians.shape[0])]

        arcs_data = pd.DataFrame({
            'start_angle': points[:-1],
            'end_angle': points[1:],
            'line_color': colors
        })

        self.arcs_data = ColumnDataSource(arcs_data)

        # Text
        if self.label:
            text_radius = 1.1
            angles = (points[:-1]+points[1:])/2.0

            text_positions = pd.DataFrame({
                'angles': angles,
                'text_x': np.cos(angles) * text_radius,
                'text_y': np.sin(angles) * text_radius,
                'text': list(self.label)
            })

            self.text_data = ColumnDataSource(text_positions)

        # Lines

        all_areas = []
        for i in range(areas_in_radians.shape[0]):
            all_areas.append(Area(weights_of_areas[i], points[:-1][i], points[1:][i]))

        all_connections = []
        for j, region1 in enumerate(self.matrix):
            # Get the connections origin region
            source = all_areas[j]
            color = colors[j]
            weight = weights_of_areas[j]

            for k, region2 in enumerate(region1):
                # Get the connection destination region
                target = all_areas[k]
                for _ in range(int(region2)):
                    p1 = source.free_points.pop()
                    p2 = target.free_points.pop()
                    # Get both regions free points and create a connection with the data
                    all_connections.append(p1 + p2 + [color, weight])

        connections_df = pd.DataFrame(all_connections, dtype=str)
        connections_df.columns = ["start_x", "start_y", "end_x", "end_y", "colors", "weight"]
        connections_df["cx0"] = connections_df.start_x.astype("float64")/2
        connections_df["cy0"] = connections_df.start_y.astype("float64")/2
        connections_df["cx1"] = connections_df.end_x.astype("float64")/2
        connections_df["cy1"] = connections_df.end_y.astype("float64")/2
        connections_df.weight = (connections_df.weight.astype("float64")/connections_df.weight.astype("float64").sum()) * 3000

        self.connection_data = ColumnDataSource(connections_df)

    def yield_renderers(self):
        """Use the marker glyphs to display the arcs and beziers.
        Takes reference points from data loaded at the ColumnDataSource.
        """
        beziers = Bezier(x0='start_x',
                         y0='start_y',
                         x1='end_x',
                         y1='end_y',
                         cx0='cx0',
                         cy0='cy0',
                         cx1='cx1',
                         cy1='cy1',
                         line_alpha='weight',
                         line_color='colors')

        yield GlyphRenderer(data_source=self.connection_data, glyph=beziers)

        arcs = Arc(x=0,
                   y=0,
                   radius=1,
                   line_width=10,
                   start_angle='start_angle',
                   end_angle='end_angle',
                   line_color='line_color')

        yield GlyphRenderer(data_source=self.arcs_data, glyph=arcs)

        if self.label:

            text_props = {
                "text_color": "#000000",
                "text_font_size": "8pt",
                "text_align": "left",
                "text_baseline": "middle"
            }

            labels = Text(x='text_x',
                          y='text_y',
                          text='text',
                          angle='angles',
                          **text_props
                          )

            yield GlyphRenderer(data_source=self.text_data, glyph=labels)


@help(ChordBuilder)
def Chord(data, source=None, target=None, value=None, square_matrix=False, label=None, xgrid=False, ygrid=False, **kw):
    """
    Create a chord chart using :class:`ChordBuilder <bokeh.charts.builders.chord_builder.ChordBuilder>`
    to render a chord graph from a variety of value forms.
    This chart displays the inter-relationships between data in a matrix.

    The data can be generated by the chart interface. Given a :class:`DataFrame <pandas.DataFrame>`,
    select two columns to be used as arcs with `source` and `target` attributes, passing by the name of those columns.
    The :class:`Chord <bokeh.charts.builders.chord_builder.Chord>` chart will then deduce the
    relationship between the arcs.

    The value of the connections can be inferred automatically by counting `source` and `target`. If you prefer
    you can assign a fixed value for all the connections with `value` simply passing by a number. A third option is to
    pass a reference to a third column in the :class:`DataFrame <pandas.DataFrame>` with the values for the connections.

    If you want to plot the relationships in a squared matrix, simply pass the matrix and set `square_matrix` attribute
    to `True`.

    Reference: `Chord diagram on Wikipedia <https://en.wikipedia.org/wiki/Chord_diagram>`_

    Args:
        data (:ref:`userguide_charts_data_types`): the data source for the chart.
        source (list(str) or str, optional): Data source to use as origin of the connection to a destination.
        target (list(str) or str, optional): Data source to use as destination of a connection.
        value (list(num) or num, optional): The value the connection should have.
        square_matrix (bool, optional): If square matrix, avoid any calculations during the setup.
        label (list(str), optional): The labels to be put in the areas.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the chord

    Examples:

    .. bokeh-plot::
        :source-position: above

        import pandas as pd
        from bokeh.charts import Chord
        from bokeh.io import show, output_file
        from bokeh.sampledata.les_mis import data

        nodes = data['nodes']
        links = data['links']

        nodes_df = pd.DataFrame(nodes)
        links_df = pd.DataFrame(links)

        source_data = links_df.merge(nodes_df, how='left', left_on='source', right_index=True)
        source_data = source_data.merge(nodes_df, how='left', left_on='target', right_index=True)
        source_data = source_data[source_data["value"] > 5]  # Select those with 5 or more connections

        chord_from_df = Chord(source_data, source="name_x", target="name_y", value="value")
        output_file('chord_from_df.html')
        show(chord_from_df)

    """

    kw["origin"] = source
    kw["destination"] = target
    kw["value"] = value
    kw["square_matrix"] = square_matrix
    kw["label"] = label
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid

    chart = create_and_build(ChordBuilder, data, **kw)

    chart.left[0].visible = False
    chart.below[0].visible = False
    chart.outline_line_color = None

    return chart
