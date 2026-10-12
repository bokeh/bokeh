''' This example creates an interactive map visualization of airport routes and locations using Bokeh.

.. bokeh-example-metadata::
    :sampledata: airport_routes, us_states
    :apis: bokeh.models.GeometryDataSource, bokeh.models.GraphSelectionPolicy, bokeh.models.StaticLayoutProvider, bokeh.models.TapTool
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, interactive, map, routes, airports, hover tool, tap tool
'''

# Standard library imports
from math import isfinite

# Bokeh imports
from bokeh.layouts import column
from bokeh.models import (
    CustomJS,
    Div,
    GraphSelectionPolicy,
    HoverTool,
    NormalHead,
    StaticLayoutProvider,
    TapTool,
)
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
           width=900, height=500, sizing_mode="scale_width", max_width=900,
           match_aspect=True, background_fill_color=Set3_12[4],
           background_fill_alpha=0.2, tools='box_zoom,reset',
           title="Directed US airport routes")

p.polygons(state_geometry, line_color='grey', line_width=1.0,
           fill_color=Set3_12[10])

r = p.graph(
    airports, routes, layout_provider,
    ## node style props
    node_fill_color=Set3_12[3], node_fill_alpha=0.4, node_line_color="black", node_line_alpha=0.3,
    node_nonselection_fill_color=Set3_12[3], node_nonselection_fill_alpha=0.2, node_nonselection_line_alpha=0.1,
    node_selection_fill_color="#f28e2b", node_selection_fill_alpha=0.9, node_selection_line_alpha=0.5,
    ## edge style props
    edge_line_color="black", edge_line_alpha=0.04,
    edge_nonselection_line_color="black", edge_nonselection_line_alpha=0.01,
    edge_selection_line_alpha=0.7, edge_selection_line_color="#f28e2b",
    ## graph interaction
    selection_policy=GraphSelectionPolicy(include_incident_edges=True),
)

# The full route network is too dense for permanent arrowheads, so only the
# selection glyph gets a visible one.
r.edge_renderer.add_decoration(
    NormalHead(size=10, fill_alpha=0, line_alpha=0),
    "end",
    inset=7,
    selection_marking=NormalHead(size=11, fill_color="#f28e2b", fill_alpha=0.9, line_color=None),
    nonselection_marking=None,
    hover_marking=None,
    muted_marking=None,
)

hover = HoverTool(tooltips=[("Airport", "@Name (@IATA), @City ")], renderers=[r])
tap = TapTool(renderers=[r])
p.add_tools(hover, tap)

header = Div(sizing_mode="stretch_width", max_width=900, text="""
<h2 style="margin: 0 0 0.35em">Explore directed airport routes</h2>
<p style="margin: 0">Click an airport to select every arriving and departing
route. Selected routes turn orange and gain arrowheads that point toward their
destination; hover identifies an airport without changing the selection.</p>
""")
status = Div(sizing_mode="stretch_width", max_width=900, text="<b>Current selection:</b> no airports or routes")
callback = CustomJS(args=dict(nodes=r.data_source.nodes, edges=r.data_source.edges, status=status), code="""
    const node_ids = nodes.get("index")
    const airport_codes = nodes.get("IATA")
    const code_by_id = new Map(Array.from(node_ids, (id, i) => [id, airport_codes[i]]))
    const starts = edges.get("start")
    const ends = edges.get("end")
    const selected_nodes = nodes.selected.indices.map((i) => airport_codes[i])
    const selected_edges = edges.selected.indices
    const route_preview = selected_edges.slice(0, 4).map((i) =>
        `${code_by_id.get(starts[i])} → ${code_by_id.get(ends[i])}`)
    const remaining = selected_edges.length - route_preview.length
    const routes = route_preview.join(", ") + (remaining > 0 ? `, and ${remaining} more` : "")
    status.text = `<b>Current selection:</b> airports ` +
        `${selected_nodes.length != 0 ? selected_nodes.join(", ") : "none"}` +
        ` &nbsp;|&nbsp; routes ${routes || "none"}`
""")
r.data_source.nodes.selected.js_on_change("indices", callback)
r.data_source.edges.selected.js_on_change("indices", callback)

show(column(header, p, status, sizing_mode="stretch_width", max_width=900))
