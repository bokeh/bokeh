import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import type {GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {GraphRenderer} from "@bokehjs/models/renderers/graph_renderer"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import type {GlyphRendererWithSource} from "@bokehjs/models/renderers/glyph_renderer"
import {StaticLayoutProvider} from "@bokehjs/models/graphs"
import {SegmentView} from "@bokehjs/models/glyphs/segment"
import {Segment} from "@bokehjs/models/glyphs/segment"
import {BezierView} from "@bokehjs/models/glyphs/bezier"
import {Bezier} from "@bokehjs/models/glyphs/bezier"
import {Scatter, MultiLine} from "@bokehjs/models/glyphs"
import {ScatterView} from "@bokehjs/models/glyphs/scatter"
import {Plot} from "@bokehjs/models/plots"
import {Document} from "@bokehjs/document"
import {ModelChangedEvent, ColumnsPatchedEvent} from "@bokehjs/document/events"
import {assert} from "@bokehjs/core/util/assert"
import {SerializationError} from "@bokehjs/core/serialization"
import * as sinon from "sinon"
import {restorable} from "#framework/util"
import {defer} from "@bokehjs/core/util/defer"
import {logger} from "@bokehjs/core/logging"

type GraphComponents = {
  test_graph: GraphRenderer
  test_layout_provider: StaticLayoutProvider
  test_document: Document
  test_graph_view: GraphRendererView
}

async function create_graph_document(edge_glyph: MultiLine | Segment | Bezier = MultiLine.create({line_width: 2, line_color: "gray"})): Promise<GraphComponents> {
  const layout_provider = StaticLayoutProvider.create({
    graph_layout: new Map([
      [4, [2, 1]],
      [5, [2, 2]],
      [6, [3, 1]],
      [7, [3, 2]],
    ]),
  })

  const node_renderer = GlyphRenderer.create<GlyphRendererWithSource<Scatter, ColumnDataSource>>({
    glyph: Scatter.create({size: 10, fill_color: "red"}),
    data_source: ColumnDataSource.create({data: {index: [4, 5, 6, 7]}}),
  })
  const edge_renderer = GlyphRenderer.create<GlyphRendererWithSource<typeof edge_glyph, ColumnDataSource>>({
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

  it("deserializes supplied graph renderers without constructing temporary defaults", () => {
    const layout_provider = StaticLayoutProvider.create({graph_layout: new Map([[0, [1, 2]]])})
    const data_source = GraphDataSource.create({nodes: [0], edges: []})
    const graph = GraphRenderer.create({data_source, layout_provider})
    const doc = new Document({roots: [graph]})
    const encoded = doc.to_json()

    using create_source = restorable(sinon.spy(GraphDataSource, "create"))
    using create_table = restorable(sinon.spy(ColumnDataSource, "create"))
    using create_renderer = restorable(sinon.spy(GlyphRenderer, "create"))
    const [decoded] = Document.from_json(encoded).roots()
    assert(decoded instanceof GraphRenderer)

    expect(create_source.callCount).to.be.equal(0)
    expect(create_table.callCount).to.be.equal(0)
    expect(create_renderer.callCount).to.be.equal(0)
    expect(decoded.node_renderer.data_source).to.be.identical(decoded.data_source.nodes)
    expect(decoded.edge_renderer.data_source).to.be.identical(decoded.data_source.edges)
  })

  it("fills missing graph properties around a decoded node renderer", () => {
    const layout_provider = StaticLayoutProvider.create()
    const source = ColumnDataSource.create({data: {index: [0]}})
    const node_renderer = GlyphRenderer.create({glyph: Scatter.create(), data_source: source})
    const encoded = new Document({roots: [layout_provider, node_renderer]}).to_json()
    encoded.roots.push({
      $type: "GraphRenderer", $id: "graph", layout_provider: layout_provider.ref(), node_renderer: node_renderer.ref(),
    })

    const [, decoded_node_renderer, decoded] = Document.from_json(encoded).roots()
    assert(decoded instanceof GraphRenderer)
    expect(decoded_node_renderer).to.be.identical(decoded.node_renderer)
    expect(decoded.data_source.nodes).to.be.identical(decoded.node_renderer.data_source)
    expect(decoded.edge_renderer.data_source).to.be.identical(decoded.data_source.edges)
    expect(decoded.data_source.node_ids).to.be.equal([0])
  })

  it("rejects mismatched renderer and graph sources", () => {
    const data_source = GraphDataSource.create()
    const node_renderer = GlyphRenderer.create({glyph: Scatter.create(), data_source: ColumnDataSource.create()})

    expect(() => GraphRenderer.create({data_source, node_renderer})).to.throw(
      Error,
      "GraphRenderer node_renderer and data_source must use the same node source",
    )
  })

})

describe("GraphRendererView", () => {
  it("disconnects layout handlers and skips queued work on graph removal", async () => {
    const {test_graph_view: view, test_layout_provider: layout} = await create_graph_document()
    const node = view.node_view
    const set_data = node._set_data.bind(node)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(node, "_set_data").callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    }))
    using paint = restorable(sinon.spy(node, "request_paint"))
    layout.graph_layout = new Map([[4, [10, 1]], [5, [20, 2]], [6, [30, 3]], [7, [40, 4]]])
    await active
    layout.graph_layout = new Map([[4, [11, 1]], [5, [22, 2]], [6, [33, 3]], [7, [44, 4]]])
    node.update_data()
    const ready = view.ready
    view.remove()
    await ready
    release()
    await defer()
    layout.graph_layout = new Map([[4, [12, 1]], [5, [23, 2]], [6, [34, 3]], [7, [45, 4]]])
    await defer()
    expect(stub.callCount).to.be.equal(1)
    expect(paint.callCount).to.be.equal(0)
    await view.ready
  })

  it("reports a shared layout update failure once through graph readiness", async () => {
    const {test_graph_view: view, test_layout_provider: layout} = await create_graph_document()
    const error = new Error("node layout failure")
    using stub = restorable(sinon.stub(view.node_view, "_set_data").rejects(error))
    using log = restorable(sinon.spy(logger, "error"))
    layout.graph_layout = new Map([[4, [10, 1]], [5, [20, 2]], [6, [30, 3]], [7, [40, 4]]])
    const failure = await view.ready.catch((failure: unknown) => failure)
    expect(failure).to.be.identical(error)
    expect(stub.callCount).to.be.equal(1)
    expect(log.callCount).to.be.equal(1)
  })

  it("serializes layout updates with expression-driven data preparation", async () => {
    const {test_graph_view: view, test_layout_provider: layout} = await create_graph_document()
    const node = view.node_view
    const set_data = node._set_data.bind(node)
    let release!: () => void
    let started!: () => void
    const gate = new Promise<void>((resolve) => release = resolve)
    const active = new Promise<void>((resolve) => started = resolve)
    using stub = restorable(sinon.stub(node, "_set_data").callsFake(set_data))
    stub.onFirstCall().callsFake(async (indices) => {
      await set_data(indices)
      started()
      await gate
    })
    layout.graph_layout = new Map([[4, [10, 1]], [5, [20, 2]], [6, [30, 3]], [7, [40, 4]]])
    await active
    layout.graph_layout = new Map([[4, [11, 1]], [5, [22, 2]], [6, [33, 3]], [7, [44, 4]]])
    await defer()
    expect(stub.callCount).to.be.equal(1)
    release()
    await view.ready
    expect(stub.callCount).to.be.equal(2)
    expect([...(node.glyph as ScatterView).x]).to.be.equal([11, 22, 33, 44])
  })

  it("should keep the plot usable with an unsupported edge glyph", async () => {
    // @ts-expect-error Exercise the runtime fallback for an unsupported edge glyph.
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

    const {x, y} = test_graph.layout_provider.node_coordinates.v_compute(test_graph.node_renderer.data_source)
    expect(x).to.be.equal(new Float64Array([3, 4, 5, 6]))
    expect(y).to.be.equal(new Float64Array([0, 1, 2, 3]))
  })
})

async function patch_graph_layout({test_layout_provider: layout, test_document: doc, test_graph_view: view}: GraphComponents): Promise<void> {
  const coordinates = new Map([[4, [0, 0]], [5, [10, 10]], [6, [20, 20]], [7, [30, 30]]])
  doc.apply_json_patch(doc.create_json_patch([new ModelChangedEvent(doc, layout, "graph_layout", coordinates)]))
  await view.ready
}

describe("alternate graph edges", () => {
  for (const glyph of [Segment.create(), Bezier.create()]) {
    it(`updates ${glyph.type} endpoints after a layout patch`, async () => {
      const graph = await create_graph_document(glyph.clone())
      const edge = graph.test_graph_view.edge_view.glyph
      assert(edge instanceof SegmentView || edge instanceof BezierView)
      expect([...edge.x0]).to.be.equal([2, 2, 2, 3])
      expect([...edge.x1]).to.be.equal([2, 3, 3, 3])

      await patch_graph_layout(graph)
      expect([...edge.x0]).to.be.equal([0, 0, 10, 20])
      expect([...edge.x1]).to.be.equal([10, 20, 20, 30])
    })

    it(`updates ${glyph.type} and node state glyphs after a layout patch`, async () => {
      const graph = await create_graph_document(glyph.clone())
      const {edge_view, node_view} = graph.test_graph_view
      graph.test_graph.data_source.edges.selected.indices = [0]
      await edge_view.ready
      await patch_graph_layout(graph)

      const {glyph: edge} = edge_view
      assert(edge instanceof SegmentView || edge instanceof BezierView)
      for (const state of [edge_view.selection_glyph, edge_view.nonselection_glyph, edge_view.muted_glyph]) {
        assert(state instanceof SegmentView || state instanceof BezierView)
        expect([...state.x0]).to.be.equal([...edge.x0])
        expect([...state.x1]).to.be.equal([...edge.x1])
        expect([...state.sx0]).to.be.equal([...edge.sx0])
        expect([...state.sy1]).to.be.equal([...edge.sy1])
        if (edge instanceof BezierView) {
          assert(state instanceof BezierView)
          expect([...state.cx0]).to.be.equal([...edge.cx0])
        }
      }
      for (const state of [node_view.selection_glyph, node_view.nonselection_glyph, node_view.muted_glyph]) {
        assert(state instanceof ScatterView)
        expect([...state.x]).to.be.equal([0, 10, 20, 30])
        expect([...state.y]).to.be.equal([0, 10, 20, 30])
      }
    })

    it(`serializes initialized ${glyph.type} edges`, async () => {
      const {test_document: doc} = await create_graph_document(glyph.clone())
      expect(() => doc.to_json(true)).to.not.throw(SerializationError)
    })
  }

  it("updates Bezier controls when replacing the edge table", async () => {
    const {test_graph: graph, test_graph_view: view} = await create_graph_document(Bezier.create())
    const {edges} = graph.data_source
    assert(edges instanceof ColumnDataSource)
    edges.data = {start: [4], end: [7], cx0: [2], cy0: [3], cx1: [4], cy1: [5]}
    await view.edge_view.ready

    const curve = view.edge_view.glyph
    assert(curve instanceof BezierView)
    expect([...curve.cx0]).to.be.equal([2])
    expect([...curve.cy1]).to.be.equal([5])
  })

  it("updates Bezier controls after an edge column patch", async () => {
    const {test_graph: graph, test_graph_view: view, test_document: doc} = await create_graph_document(Bezier.create())
    const {edges} = graph.data_source
    assert(edges instanceof ColumnDataSource)
    edges.data = {start: [4], end: [7], cx0: [2], cy0: [3], cx1: [4], cy1: [5]}
    await view.edge_view.ready

    const event = new ColumnsPatchedEvent(doc, edges, "data", {cx0: [[0, 9]]})
    doc.apply_json_patch(doc.create_json_patch([event]))
    await view.edge_view.ready

    const curve = view.edge_view.glyph
    assert(curve instanceof BezierView)
    expect([...curve.cx0]).to.be.equal([9])
  })

  it("should reject partial Bezier controls", () => {
    const layout = StaticLayoutProvider.create({graph_layout: new Map([[0, [0, 0]], [1, [1, 1]]])})
    const source = ColumnDataSource.create({data: {start: [0], end: [1], cx0: [0.3]}})
    expect(() => layout.get_edge_control_coordinates(source)).to.throw(Error)
  })
})
