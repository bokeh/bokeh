''' Explore connections between airports in the contiguous United States.

.. bokeh-example-metadata::
    :title: Routes from one airport
    :keywords: graph, map, airports, routes, hover, selection
    :categories: topics/graph, topics/geo
    :apis: bokeh.models.StaticLayoutProvider, bokeh.models.NodesAndLinkedEdges, bokeh.models.TapTool
    :sampledata: airport_routes, us_states
    :refs: :ref:`ug_topics_graph`
    :gallery: A map of the contiguous United States with routes fanning out from the selected airport in Albuquerque.
'''

from collections import Counter

from bokeh.layouts import column
from bokeh.models import (
    Div,
    HoverTool,
    NodesAndLinkedEdges,
    StaticLayoutProvider,
    TapTool,
)
from bokeh.plotting import figure, show
from bokeh.sampledata.airport_routes import airports, routes
from bokeh.sampledata.us_states import data as us_states

mainland = airports.loc[
    (airports.Country == "United States")
    & airports.Longitude.between(-125, -66)
    & airports.Latitude.between(24, 50),
].set_index("AirportID").rename_axis("index")
airport_ids = set(mainland.index)

# A single line represents each airport pair, regardless of airline or direction.
pairs = sorted({
    (min(start, end), max(start, end))
    for start, end in routes[["SourceID", "DestinationID"]].itertuples(index=False, name=None)
    if start in airport_ids and end in airport_ids and start != end
})
connections = Counter(airport_id for pair in pairs for airport_id in pair)
nodes = mainland.loc[list(connections), ["IATA", "Name", "City", "Longitude", "Latitude"]].copy()
nodes["connections"] = nodes.index.map(connections.__getitem__)
edges = {"start": [start for start, _ in pairs], "end": [end for _, end in pairs]}
layout = StaticLayoutProvider(graph_layout=dict(zip(nodes.index, zip(nodes.Longitude, nodes.Latitude))))

p = figure(
    title="Airport connections in the contiguous U.S.",
    x_range=(-127, -64), y_range=(22, 51), width=900, height=490,
    tools="pan,wheel_zoom,reset", toolbar_location="above",
    background_fill_color="#edf4f8", outline_line_color=None,
)
p.axis.visible = False
p.grid.visible = False
p.toolbar.logo = None

states = [state for code, state in us_states.items() if code not in {"AK", "HI"}]
p.patches(
    [state["lons"] for state in states], [state["lats"] for state in states],
    fill_color="#f8fafc", line_color="#cbd5e1", line_width=0.8,
)

graph = p.graph(
    nodes, edges, layout, selection_policy=NodesAndLinkedEdges(),
    node_size=6, node_fill_color="#334155", node_fill_alpha=0.63, node_line_color=None,
    node_nonselection_fill_alpha=0.37,
    edge_line_color="#2563eb", edge_line_width=1.2, edge_line_alpha=0,
    edge_nonselection_line_alpha=0, edge_selection_line_alpha=0.72,
)

node = graph.node_renderer.glyph
graph.node_renderer.selection_glyph = node.clone(size=12, fill_color="#d97706")
graph.node_renderer.hover_glyph = node.clone(size=10, fill_color="#d97706")

initial_airport = nodes.index[nodes.IATA == "ABQ"][0]
graph.node_renderer.data_source.selected.indices = [nodes.index.get_loc(initial_airport)]
graph.edge_renderer.data_source.selected.indices = [i for i, pair in enumerate(pairs) if initial_airport in pair]

tap = TapTool(renderers=[graph])
hover = HoverTool(renderers=[graph], tooltips=[
    ("Airport", "@Name (@IATA)"),
    ("City", "@City"),
    ("Connected airports", "@connections"),
])
p.add_tools(tap, hover)
p.toolbar.active_tap = tap

intro = Div(width=900, text="""
Click an airport to see its connections. The map starts with Albuquerque selected.
Hover a dot for airport details.
""")
show(column(intro, p))
