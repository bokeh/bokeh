''' Update the nodes and edges of a graph by replacing records.

.. bokeh-example-metadata::
    :apis: bokeh.models.GraphDataSource, bokeh.models.GraphRenderer, bokeh.models.RecordDataSource
    :refs: :ref:`ug_topics_graph`
    :keywords: graph, network, records, callbacks
'''

from bokeh.layouts import column
from bokeh.models import (
    CustomJS,
    Div,
    GraphDataSource,
    GraphRenderer,
    LabelSet,
    RadioButtonGroup,
    RecordDataSource,
    StaticLayoutProvider,
)
from bokeh.plotting import figure, show

stations = [
    {"index": "Control", "x": 0, "y": 0, "color": "#17324d"},
    {"index": "Buoy", "x": 1.25, "y": 1, "color": "#0f766e"},
    {"index": "Estuary", "x": 2.8, "y": 0.85, "color": "#0f766e"},
    {"index": "Dune", "x": 2.8, "y": -0.92, "color": "#0f766e"},
]
relay = {"index": "Ridge relay", "x": 1.3, "y": -0.9, "color": "#b45309"}
station_records = [stations, [*stations, relay]]

coastal_links = [
    {"start": "Control", "end": "Buoy", "color": "#0f766e"},
    {"start": "Buoy", "end": "Estuary", "color": "#0f766e"},
]
link_records = [
    [*coastal_links, {"start": "Control", "end": "Dune", "color": "#64748b"}],
    [
        *coastal_links,
        {"start": "Control", "end": "Ridge relay", "color": "#b45309"},
        {"start": "Ridge relay", "end": "Dune", "color": "#b45309"},
    ],
]

nodes = RecordDataSource(records=station_records[0])
edges = RecordDataSource(records=link_records[0])
layout = StaticLayoutProvider(graph_layout={
    station["index"]: (station["x"], station["y"]) for station in station_records[1]
})
graph = GraphRenderer(data_source=GraphDataSource(nodes=nodes, edges=edges), layout_provider=layout)
graph.node_renderer.glyph.update(size=24, fill_color="color", line_color="white", line_width=2)
graph.edge_renderer.glyph.update(line_color="color", line_width=4)

plot = figure(
    width=640, height=350, x_range=(-0.5, 3.3), y_range=(-1.42, 1.48),
    tools="", toolbar_location=None, background_fill_color="#f8fafc", outline_line_color=None,
)
plot.axis.visible = False
plot.grid.visible = False
plot.renderers.append(graph)
plot.add_layout(LabelSet(
    x="x", y="y", text="index", source=nodes, y_offset=17,
    text_align="center", text_color="#17324d", text_font_size="13px",
))

header = Div(width=640, text="""
<h2 style="margin: 0 0 0.35em">A coastal monitoring network</h2>
<p style="margin: 0">Deploy the ridge relay to reroute the link to Dune. The control replaces
both source record lists, and the graph and station labels update in place.</p>
""")
plan = RadioButtonGroup(labels=["Direct link", "Relay deployed"], active=0, width=640)
status = Div(width=640, text="4 stations · 3 links")
plan.js_on_change("active", CustomJS(
    args=dict(nodes=nodes, edges=edges, station_records=station_records, link_records=link_records, status=status),
    code="""
    const i = cb_obj.active
    nodes.records = station_records[i]
    edges.records = link_records[i]
    status.text = `${nodes.records.length} stations · ${edges.records.length} links`
    """,
))
show(column(header, plan, plot, status))
