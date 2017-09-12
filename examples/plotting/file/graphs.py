from bokeh.models import StaticLayoutProvider, ColumnDataSource, HoverTool, TapTool
from bokeh.models.graphs import NodesAndLinkedEdges
from bokeh.palettes import Set3_12
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.us_states import data as us_states
from bokeh.sampledata.airport_routes import airports, routes

import numpy as np

output_file("graphs.html")

airports.set_index("AirportID", inplace=True)
airports.index.rename("index", inplace=True)
routes.rename(columns={"SourceID": "start", "DestinationID": "end"}, inplace=True)

lats, lons = [], []
for k, v in us_states.items():
    lats.append(np.array(v['lats']))
    lons.append(np.array(v['lons']))

source = ColumnDataSource(data=dict(lats=lats, lons=lons))

graph_layout = dict(zip(airports.index.astype(str), zip(airports.Longitude, airports.Latitude)))
layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

fig = figure(x_range=(-180, -60), y_range=(15,75),
              x_axis_label="Longitude", y_axis_label="Latitude",
              plot_width=800, plot_height=600, background_fill_color=Set3_12[4],
              background_fill_alpha=0.2, tools='box_zoom,reset')

fig.patches(xs="lons", ys="lats", line_color='grey', line_width=1.0,
             fill_color=Set3_12[10], source=source)

r = fig.graph(airports, routes, layout_provider,
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
              inspection_policy=NodesAndLinkedEdges(), selection_policy=NodesAndLinkedEdges())

hover = HoverTool(tooltips=[("Airport", "@Name (@IATA), @City ")], renderers=[r])
tap = TapTool(renderers=[r])
fig.add_tools(hover, tap)

show(fig)
