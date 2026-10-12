import Bokeh from "/static/js/bokeh.esm.js"
import "/static/js/bokeh-api.esm.js"

export namespace ClientSideGraphLayout {
  import plt = Bokeh.Plotting

  const source = Bokeh.GraphDataSource.create({
    nodes: [
      {id: "A", color: "#4c78a8"},
      {id: "B", color: "#f58518"},
      {id: "C", color: "#e45756"},
      {id: "D", color: "#72b7b2"},
      {id: "E", color: "#54a24b"},
      {id: "F", color: "#eeca3b"},
    ],
    edges: [
      ["A", "B", {curvature: 0.16, arrow_size: 12}],
      ["A", "C", {curvature: -0.12, arrow_size: 15}],
      ["B", "C", {curvature: 0.1, arrow_size: 12}],
      ["C", "D", {curvature: -0.08, arrow_size: 14}],
      ["D", "E", {curvature: 0.14, arrow_size: 12}],
      ["D", "F", {curvature: -0.16, arrow_size: 15}],
      ["E", "F", {curvature: 0.1, arrow_size: 12}],
    ],
    selection_policy: Bokeh.GraphSelectionPolicy.create({
      node_hops: 1,
      include_incident_edges: true,
    }),
  })

  const graph = Bokeh.GraphRenderer.create({
    data_source: source,
    layout_provider: Bokeh.ForceDirectedLayoutProvider.create({seed: 11, iterations: 150}),
    edge_path_provider: Bokeh.BezierEdgePathProvider.create({curvature: {field: "curvature"}, steps: 20}),
  })
  graph.node_renderer.glyph = Bokeh.Scatter.create({
    size: 18,
    fill_color: {field: "color"},
    line_color: "white",
  })
  graph.node_renderer.selection_glyph = Bokeh.Scatter.create({
    size: 22,
    fill_color: {field: "color"},
    line_color: "black",
  })
  graph.edge_renderer.glyph = Bokeh.MultiLine.create({line_alpha: 0.45, line_width: 2})
  graph.edge_renderer.selection_glyph = Bokeh.MultiLine.create({
    line_alpha: 1,
    line_color: "#d62728",
    line_width: 4,
  })
  graph.edge_renderer.add_decoration(Bokeh.NormalHead.create({
    size: {field: "arrow_size"},
    fill_color: "#52667a",
    line_color: null,
  }), "end", {
    inset: 11,
    selection_marking: Bokeh.NormalHead.create({
      size: {field: "arrow_size"},
      fill_color: "#d62728",
      line_color: null,
    }),
  })

  const plot = plt.figure({
    width: 700,
    height: 500,
    x_range: [-1.2, 1.2],
    y_range: [-1.2, 1.2],
    tools: "pan,wheel_zoom,tap,reset",
    active_scroll: "wheel_zoom",
    title: "Client-side force-directed layout with directed curved edges",
  })
  plot.add_renderers(graph)

  void plt.show(plot)
}
