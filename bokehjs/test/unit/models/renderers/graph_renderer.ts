import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"
import {GraphRenderer} from "@bokehjs/models/renderers/graph_renderer"
import {GraphSelectionPolicy} from "@bokehjs/models/selections/interaction_policy"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {StaticLayoutProvider, StraightEdgePathProvider} from "@bokehjs/models/graphs"
import {SegmentView} from "@bokehjs/models/glyphs/segment"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {BezierView} from "@bokehjs/models/glyphs/bezier"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {Scatter, MultiLine} from "@bokehjs/models/glyphs"
import {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Plot} from "@bokehjs/models/plots"
import type {Document} from "@bokehjs/document"
import {ModelChangedEvent, ColumnsPatchedEvent} from "@bokehjs/document/events"
import {assert} from "@bokehjs/core/util/assert"
import {SerializationError} from "@bokehjs/core/serialization"

type GraphComponents = {
  test_graph: GraphRenderer
  test_layout_provider: StaticLayoutProvider
  test_document: Document
  test_graph_view: GraphRendererView
}

async function create_graph_document(edge_glyph: MultiLine | Segment | Bezier | Scatter = MultiLine.create({line_width: 2, line_color: "gray"})): Promise<GraphComponents> {
  const layout_provider = StaticLayoutProvider.create({
    graph_layout: new Map([
      [4, [2, 1]],
      [5, [2, 2]],
      [6, [3, 1]],
      [7, [3, 2]],
    ]),
  })

  const node_renderer = GlyphRenderer.create({
    glyph: Scatter.create({size: 10, fill_color: "red"}),
    data_source: ColumnDataSource.create({data: {index: [4, 5, 6, 7]}}),
  })
  const edge_renderer = GlyphRenderer.create({
    glyph: edge_glyph,
    data_source: ColumnDataSource.create({data: {start: [4, 4, 5, 6], end: [5, 6, 6, 7]}}),
  })

  const graph = GraphRenderer.create({layout_provider, node_renderer, edge_renderer})
  const plot = Plot.create({renderers: [graph]})
  const {view} = await display(plot)

  return {
    test_graph: graph,
    test_layout_provider: layout_provider,
    test_document: plot.document!,
    test_graph_view: view.owner.get_one(graph),
  }
}

describe("GraphRenderer", () => {
  it("couples renderer sources in a GraphDataSource", () => {
    const node_source = ColumnDataSource.create({data: {index: [0, 1]}})
    const edge_source = ColumnDataSource.create({data: {start: [0], end: [1]}})
    const node_renderer = GlyphRenderer.create({glyph: Scatter.create(), data_source: node_source})
    const edge_renderer = GlyphRenderer.create({glyph: MultiLine.create(), data_source: edge_source})
    const graph = GraphRenderer.create({node_renderer, edge_renderer})

    expect(graph.data_source.nodes).to.be.equal(node_source)
    expect(graph.data_source.edges).to.be.equal(edge_source)
  })

  it("constructs renderers from a GraphDataSource", () => {
    const node_source = ColumnDataSource.create({data: {index: [0, 1]}})
    const edge_source = ColumnDataSource.create({data: {start: [0], end: [1]}})
    const data_source = GraphDataSource.create({nodes: node_source, edges: edge_source})
    const graph = GraphRenderer.create({data_source})

    expect(graph.node_renderer.data_source).to.be.equal(node_source)
    expect(graph.edge_renderer.data_source).to.be.equal(edge_source)
  })

  it("rejects mismatched renderer and graph sources", () => {
    const data_source = GraphDataSource.create()
    const node_renderer = GlyphRenderer.create({glyph: Scatter.create(), data_source: ColumnDataSource.create()})

    expect(() => GraphRenderer.create({data_source, node_renderer})).to.throw(
      Error,
      "GraphRenderer node_renderer and data_source must use the same node source",
    )
  })

  it("configures selection and inspection propagation independently", () => {
    const selection_policy = GraphSelectionPolicy.create({node_hops: 2})
    const inspection_policy = GraphSelectionPolicy.create({node_hops: 1})
    const data_source = GraphDataSource.create({selection_policy})
    const graph = GraphRenderer.create({data_source, inspection_policy})

    expect(graph.data_source.selection_policy).to.be.equal(selection_policy)
    expect(graph.inspection_policy).to.be.equal(inspection_policy)
    expect(graph.inspection_policy).to.not.be.equal(graph.data_source.selection_policy)
  })
})

describe("GraphRendererView", () => {
  it("should keep the plot usable with an unsupported edge glyph", async () => {
    const {test_graph_view: view} = await create_graph_document(Scatter.create({x: 0, y: 0}))
    expect(view.node_view.glyph.data_size).to.be.equal(4)
  })

  it("should have node_renderer and edge_renderer glyphs serializable after initialization", async () => {
    const {test_document} = await create_graph_document()
    expect(() => test_document.to_json(true)).to.not.throw(SerializationError)
  })

  it("should have new x and y coordinates after graph_layout is changed", async () => {
    const {test_graph, test_layout_provider} = await create_graph_document()

    test_layout_provider.graph_layout = new Map([
      [4, [3, 0]],
      [5, [4, 1]],
      [6, [5, 2]],
      [7, [6, 3]],
    ])
    test_graph.layout_provider = test_layout_provider

    const coordinates = test_graph.layout_provider.node_coordinates(test_graph.data_source)
    const {x, y} = coordinates.v_compute(test_graph.node_renderer.data_source)
    expect(x).to.be.equal(new Float64Array([3, 4, 5, 6]))
    expect(y).to.be.equal(new Float64Array([0, 1, 2, 3]))
  })

  it("replaces coordinate expressions after graph data changes", async () => {
    const {test_graph} = await create_graph_document()
    const edge_glyph = test_graph.edge_renderer.glyph as MultiLine
    const node_glyph = test_graph.node_renderer.glyph as Scatter
    const edge_spec = edge_glyph.properties.xs.get_value() as {expr: unknown}
    const node_spec = node_glyph.properties.x.get_value() as {expr: unknown}

    expect(test_graph.data_source.edges).to.be.instanceof(ColumnDataSource)
    const edges = test_graph.data_source.edges as ColumnDataSource
    edges.data = {start: [4, 5], end: [5, 6]}

    const updated_edge_spec = edge_glyph.properties.xs.get_value() as {expr: unknown}
    const updated_node_spec = node_glyph.properties.x.get_value() as {expr: unknown}
    expect(updated_edge_spec.expr).to.not.be.equal(edge_spec.expr)
    expect(updated_node_spec.expr).to.not.be.equal(node_spec.expr)
  })
})

describe("alternate graph edges", () => {
  for (const glyph of [Segment.create(), Bezier.create()]) {
    it(`should bind ${glyph.type} coordinates and remap after layout and source updates`, async () => {
      const {test_graph: graph, test_layout_provider: layout, test_document: doc, test_graph_view: graph_view} = await create_graph_document(glyph)
      await graph_view.ready
      const edge = graph_view.edge_view.glyph
      assert(edge instanceof SegmentView || edge instanceof BezierView)
      expect([...edge.x0]).to.be.equal([2, 2, 2, 3])
      expect([...edge.x1]).to.be.equal([2, 3, 3, 3])
      graph.edge_renderer.data_source.selected.indices = [0]
      await graph_view.edge_view.ready
      doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, layout, "graph_layout",
        new Map([[4, [0, 0]], [5, [10, 10]], [6, [20, 20]], [7, [30, 30]]]),
      )]))
      await graph_view.ready
      expect([...edge.x0]).to.be.equal([0, 0, 10, 20])
      expect([...edge.x1]).to.be.equal([10, 20, 20, 30])
      for (const state of [graph_view.edge_view.selection_glyph, graph_view.edge_view.nonselection_glyph, graph_view.edge_view.muted_glyph]) {
        const state_edge = state
        assert(state_edge instanceof SegmentView || state_edge instanceof BezierView)
        expect([...state_edge.x0]).to.be.equal([...edge.x0])
        expect([...state_edge.x1]).to.be.equal([...edge.x1])
        expect([...state_edge.sx0]).to.be.equal([...edge.sx0])
        expect([...state_edge.sy1]).to.be.equal([...edge.sy1])
        if (glyph instanceof Bezier) {
          assert(state_edge instanceof BezierView && edge instanceof BezierView)
          expect([...state_edge.cx0]).to.be.equal([...edge.cx0])
        }
      }
      for (const state of [graph_view.node_view.selection_glyph, graph_view.node_view.nonselection_glyph, graph_view.node_view.muted_glyph]) {
        const state_node = state
        assert(state_node instanceof ScatterView)
        expect(Array.from(state_node.x)).to.be.equal([0, 10, 20, 30])
        expect(Array.from(state_node.y)).to.be.equal([0, 10, 20, 30])
      }
      if (glyph instanceof Bezier) {
        const source = graph.edge_renderer.data_source
        source.data = {start: [4], end: [7], cx0: [2], cy0: [3], cx1: [4], cy1: [5]}
        await graph_view.edge_view.ready
        const curve = graph_view.edge_view.glyph
        assert(curve instanceof BezierView)
        expect([...curve.cx0]).to.be.equal([2])
        expect([...curve.cy1]).to.be.equal([5])
        doc.apply_json_patch(doc.create_json_patch([new ColumnsPatchedEvent(doc, source, "data", {cx0: [[0, 9]]})]))
        await graph_view.edge_view.ready
        expect([...curve.cx0]).to.be.equal([9])
      }
      expect(() => doc.to_json(true)).to.not.throw(SerializationError)
    })
  }

  it("should reject partial Bezier controls", () => {
    const layout = StaticLayoutProvider.create({graph_layout: new Map([[0, [0, 0]], [1, [1, 1]]])})
    const source = ColumnDataSource.create({data: {start: [0], end: [1], cx0: [0.3]}})
    const graph_source = GraphDataSource.create({
      nodes: ColumnDataSource.create({data: {index: [0, 1]}}),
      edges: source,
    })
    const path = StraightEdgePathProvider.create()
    expect(() => path.get_edge_control_coordinates(graph_source, layout)).to.throw(Error)
  })
})
