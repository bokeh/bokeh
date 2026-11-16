import {expect} from "#framework/assertions"
import {display, fig, row} from "#framework/layouts"

import {assert} from "@bokehjs/core/util/assert"
import {
  ColumnDataSource, GraphDataSource, GraphRenderer, IndexFilter, IndexedSubset, MultiLine, Range1d, Scatter, StaticLayoutProvider,
} from "@bokehjs/models"
import {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {MultiLineView} from "@bokehjs/models/glyphs/multi_line"

describe("Graph data sources", () => {
  it("should keep filtered record-backed graphs aligned after streaming nodes and edges", async () => {
    function make_graph() {
      const source = GraphDataSource.create({
        nodes: [
          {id: "A", color: "#2563eb"},
          {id: "B", color: "#94a3b8"},
          {id: "C", color: "#0f766e"},
        ],
        edges: [
          {source: "A", target: "B", color: "#64748b"},
          {source: "B", target: "C", color: "#64748b"},
        ],
      })
      const layout_provider = StaticLayoutProvider.create({
        graph_layout: new Map([["A", [0, 1]], ["B", [1, 0]], ["C", [2, 1]], ["D", [3, 0]]]),
      })
      const graph = GraphRenderer.create({data_source: source, layout_provider})
      const filter = IndexFilter.create({indices: [0, 2]})
      graph.node_renderer.view = IndexedSubset.create({filter})
      graph.node_renderer.glyph = Scatter.create({size: 24, fill_color: {field: "color"}, line_color: "white"})
      graph.edge_renderer.glyph = MultiLine.create({line_color: {field: "color"}, line_width: 3})
      const plot = fig([240, 150], {
        x_range: Range1d.create({start: -0.5, end: 3.5}),
        y_range: Range1d.create({start: -0.5, end: 1.5}),
        background_fill_color: "#f8fafc",
        outline_line_color: null,
      })
      plot.add_renderers(graph)
      return {source, graph, filter, plot}
    }

    const initial = make_graph()
    const updated = make_graph()
    const {view} = await display(row([initial.plot, updated.plot]))
    const {nodes, edges} = updated.source
    assert(nodes instanceof ColumnDataSource && edges instanceof ColumnDataSource)
    nodes.stream({index: ["D"], color: ["#f28e2b"]})
    edges.stream({start: ["C"], end: ["D"], color: ["#f28e2b"]})
    updated.filter.indices = [0, 2, 3]
    await view.ready

    const graph_view = view.owner.get_one(updated.graph)
    const {glyph: node_glyph} = graph_view.node_view
    const {glyph: edge_glyph} = graph_view.edge_view
    assert(node_glyph instanceof ScatterView && edge_glyph instanceof MultiLineView)
    expect([...node_glyph.x]).to.be.equal([0, 2, 3])
    expect([...node_glyph.y]).to.be.equal([1, 1, 0])
    expect([...edge_glyph.xs.get(1)]).to.be.equal([1, 2])
    expect([...edge_glyph.xs.get(2)]).to.be.equal([2, 3])
    expect([...edge_glyph.ys.get(2)]).to.be.equal([1, 0])
  })
})
