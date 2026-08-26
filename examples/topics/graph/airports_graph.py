''' This example creates an interactive map visualization of airport routes and locations using Bokeh.

.. bokeh-example-metadata::
    :sampledata: airport_routes, us_states
    :apis: bokeh.models.GeometryDataSource, bokeh.models.GraphSelectionPolicy, bokeh.models.StaticLayoutProvider, bokeh.models.TapTool
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, interactive, map, routes, airports, hover tool, tap tool
'''

from math import isfinite

from bokeh.models import GraphSelectionPolicy, HoverTool, StaticLayoutProvider, TapTool
from bokeh.palettes import Set3_12
from bokeh.plotting import figure, show
from bokeh.sampledata.airport_routes import airports, routes
from bokeh.sampledata.us_states import data as us_states

airports.set_index("AirportID", inplace=True)
airports.index.rename("index", inplace=True)
routes.rename(columns={"SourceID": "start", "DestinationID": "end"}, inplace=True)

def geometry_from_nan_separated_xy(xs, ys):
    rings = []
    ring = []
    for x, y in zip(xs, ys):
        if isfinite(x) and isfinite(y):
            ring.append([x, y])
        elif ring:
            rings.append(ring)
            ring = []
    if ring:
        rings.append(ring)

    if len(rings) == 1:
        return {"type": "Polygon", "coordinates": rings}
    return {"type": "MultiPolygon", "coordinates": [[ring] for ring in rings]}

state_geometry = [
    geometry_from_nan_separated_xy(state["lons"], state["lats"])
    for state in us_states.values()
]

graph_layout = dict(zip(airports.index, zip(airports.Longitude, airports.Latitude)))
layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

p = figure(x_range=(-180, -60), y_range=(15,75),
           x_axis_label="Longitude", y_axis_label="Latitude",
           width=800, height=600, background_fill_color=Set3_12[4],
           background_fill_alpha=0.2, tools='box_zoom,reset')

p.polygons(state_geometry, line_color='grey', line_width=1.0,
           fill_color=Set3_12[10])

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
    ## graph interaction
    selection_policy=GraphSelectionPolicy(include_incident_edges=True),
)

hover = HoverTool(tooltips=[("Airport", "@Name (@IATA), @City ")], renderers=[r])
tap = TapTool(renderers=[r])
p.add_tools(hover, tap)

show(p)
