''' This example creates an interactive map visualization of airport routes and locations using Bokeh.

.. bokeh-example-metadata::
    :sampledata: airport_routes, us_states
    :apis: bokeh.models.ColumnDataSource, bokeh.models.StaticLayoutProvider, bokeh.models.NodesAndLinkedEdges, bokeh.models.TapTool
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, interactive, map, routes, airports, hover tool, tap tool
'''

import numpy as np

from bokeh.models import (ColumnDataSource, HoverTool, NodesAndLinkedEdges,
                          StaticLayoutProvider, TapTool)
from bokeh.palettes import Set3_12
from bokeh.plotting import figure, show
from bokeh.sampledata.airport_routes import airports, routes
from bokeh.sampledata.us_states import data as us_states

airports.set_index("AirportID", inplace=True)
airports.index.rename("index", inplace=True)
routes.rename(columns={"SourceID": "start", "DestinationID": "end"}, inplace=True)

lats = [np.array(v["lats"]) for v in us_states.values()]
lons = [np.array(v["lons"]) for v in us_states.values()]
source = ColumnDataSource(data=dict(lats=lats, lons=lons))

graph_layout = dict(zip(airports.index, zip(airports.Longitude, airports.Latitude)))
layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

p = figure(x_range=(-180, -60), y_range=(15,75),
           x_axis_label="Longitude", y_axis_label="Latitude",
           width=800, height=600, background_fill_color=Set3_12[4],
           background_fill_alpha=0.2, tools='box_zoom,reset')

p.patches(xs="lons", ys="lats", line_color='grey', line_width=1.0,
          fill_color=Set3_12[10], source=source)

r = p.graph(
    airports, routes, layout_provider,
    ## node style props
    node_fill_color=Set3_12[3], node_fill_alpha=0.4, node_line_color="black", node_line_alpha=0.3,
    node_nonselection_fill_color=Set3_12[3], node_nonselection_fill_alpha=0.2, node_nonselection_line_alpha=0.1,
    node_selection_fill_color=Set3_12[3], node_selection_fill_alpha=0.8, node_selection_line_alpha=0.3,
    ## edge style props
    edge_line_color="black", edge_line_alpha=0.04,
    edge_hover_line_alpha=0.6, edge_hover_line_color=Set3_12[1],
    edge_nonselection_line_color="black", edge_nonselection_line_alpha=0.01,
    edge_selection_line_alpha=0.6, edge_selection_line_color=Set3_12[1],
    ## graph policies
    inspection_policy=NodesAndLinkedEdges(), selection_policy=NodesAndLinkedEdges(),
)

hover = HoverTool(tooltips=[("Airport", "@Name (@IATA), @City ")], renderers=[r])
tap = TapTool(renderers=[r])
p.add_tools(hover, tap)

show(p)
