import {expect} from "chai"
import * as sinon from "sinon"

import {create_hit_test_result_from_hits, create_empty_hit_test_result} from "@bokehjs/core/hittest"

import {Selection} from "@bokehjs/models/selections/selection"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"

import {Circle} from "@bokehjs/models/glyphs/circle"
import {MultiLine} from "@bokehjs/models/glyphs/multi_line"
import {NodesOnly, NodesAndLinkedEdges, EdgesAndLinkedNodes} from "@bokehjs/models/graphs/graph_hit_test_policy"
import {LayoutProvider} from "@bokehjs/models/graphs/layout_provider"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {GraphRenderer, GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {ColumnarDataSource} from "@bokehjs/models/sources/columnar_data_source"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {Document} from "@bokehjs/document"
import {build_view} from "@bokehjs/core/build_views"

class TrivialLayoutProvider extends LayoutProvider {

  get_node_coordinates(_graph_source: ColumnarDataSource): [number[], number[]] {
    return [[], []]
  }

  get_edge_coordinates(_graph_source: ColumnarDataSource): [[number, number][], [number, number][]] {
    return [[], []]
  }
}

describe("GraphHitTestPolicy", () => {
  let node_source: ColumnDataSource
  let edge_source: ColumnDataSource
  let gr: GraphRenderer
  let gv: GraphRendererView
  let node_stub: sinon.SinonStub
  let edge_stub: sinon.SinonStub

  before_each(async () => {
    const doc = new Document()

    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })
    doc.add_root(plot)
    const plot_view = (await build_view(plot)).build()

    node_source = new ColumnDataSource({
      data: {
        index: [10, 20, 30, 40],
      },
    })
    edge_source = new ColumnDataSource({
      data: {
        start: [10, 10, 30],
        end: [20, 30, 20],
      },
    })
    const node_renderer = new GlyphRenderer({data_source: node_source, glyph: new Circle()})
    const edge_renderer = new GlyphRenderer({data_source: edge_source, glyph: new MultiLine()})

    gr = new GraphRenderer({
      node_renderer,
      edge_renderer,
      layout_provider: new TrivialLayoutProvider(),
    })

    gv = await build_view(gr, {parent: plot_view})

    node_stub = sinon.stub(gv.node_view.glyph, "hit_test")
    edge_stub = sinon.stub(gv.edge_view.glyph, "hit_test")
  })

  after_each(() => {
    node_stub.restore()
    edge_stub.restore()
  })

  describe("NodesOnly", () => {

    describe("hit_test method", () => {

      it("should return null if GlyphView doesn't have hit-testing and returns null", () => {
        node_stub.returns(null)
        const policy = new NodesOnly()
        expect(policy.hit_test({type: "point", sx: 0, sy: 0}, gv)).to.be.null
      })

      it("should return the Selection that the GlyphView hit-testing returns", () => {
        node_stub.returns(new Selection({indices: [1, 2, 3]}))
        const policy = new NodesOnly()
        const result = policy.hit_test({type: "point", sx: 0, sy: 0}, gv)
        expect(result).to.be.not.null
        expect(result!.indices).to.be.deep.equal([1, 2, 3])
      })
    })

    describe("do_selection method", () => {

      it("should return false if called with null hit_test_result", () => {
        const policy = new NodesOnly()
        expect(policy.do_selection(null, gr, true, false)).to.be.false
      })

      it("should return false and clear selections if hit_test_result is empty", () => {
        const initial_selection = create_hit_test_result_from_hits([[1, 0], [2, 0]])
        node_source.selected = initial_selection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new NodesOnly()
        const did_hit = policy.do_selection(hit_test_result, gr, true, false)

        expect(did_hit).to.be.false
        expect(node_source.selected.is_empty()).to.be.true
      })

      it("should return true if hit_test_result is not empty", () => {
        const hit_test_result = create_hit_test_result_from_hits([[0, 0], [1, 0]])
        const policy = new NodesOnly()

        expect(policy.do_selection(hit_test_result, gr, true, false)).to.be.true
        expect(node_source.selected.is_empty()).to.be.false
      })
    })

    describe("do_inspection method", () => {

      it("should return false and clear inspections if hit_test_result is empty", () => {
        // create initial inspection to clear
        const initial_inspection = create_hit_test_result_from_hits([[1, 0], [2, 0]])
        node_source.inspected = initial_inspection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new NodesOnly()
        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)

        expect(did_hit).to.be.false
        expect(node_source.inspected.is_empty()).to.be.true
      })

      it("should return true if hit_test_result is not empty", () => {
        const hit_test_result = create_hit_test_result_from_hits([[0, 0], [1, 0]])
        const policy = new NodesOnly()

        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)
        expect(did_hit).to.be.true
        expect(node_source.inspected.is_empty()).to.be.false
      })
    })
  })

  describe("NodesAndLinkedEdges", () => {

    describe("do_selection method", () => {

      it("should clear edge selections if hit_test_result is empty", () => {
        // create initial inspection to clear
        const initial_selection = create_empty_hit_test_result()
        initial_selection.multiline_indices = {0: [0, 1], 1: [0]}
        edge_source.selected = initial_selection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new NodesAndLinkedEdges()
        policy.do_selection(hit_test_result, gr, true, false)

        expect(edge_source.selected.is_empty()).to.be.true
      })

      it("should select linked edges if hit_test_result is not empty", () => {
        const hit_test_result = create_hit_test_result_from_hits([[0, 0]])
        const policy = new NodesAndLinkedEdges()

        policy.do_selection(hit_test_result, gr, true, false)

        expect(edge_source.selected.multiline_indices).to.be.deep.equal({ 0: [ 0 ], 1: [ 0 ] })
      })
    })

    describe("do_inspection method", () => {

      it("should clear edge inspections if hit_test_result is empty", () => {
        // create initial inspection to clear
        const initial_inspection = create_empty_hit_test_result()
        initial_inspection.multiline_indices = {0: [0, 1], 1: [0]}
        edge_source.inspected = initial_inspection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new NodesAndLinkedEdges()
        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)

        expect(did_hit).to.be.false
        expect(edge_source.inspected.is_empty()).to.be.true
      })

      it("should select linked edges if hit_test_result is not empty", () => {
        const hit_test_result = create_hit_test_result_from_hits([[0, 0]])
        const policy = new NodesAndLinkedEdges()
        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)

        expect(did_hit).to.be.true
        expect(edge_source.inspected.multiline_indices).to.be.deep.equal({ 0: [ 0 ], 1: [ 0 ] })
      })
    })
  })

  describe("EdgedAndLinkedNodes", () => {

    describe("do_selection method", () => {

      it("should clear node selections if hit_test result is empty", () => {
        const initial_selection = create_empty_hit_test_result()
        initial_selection.indices = [0, 1]
        node_source.selected = initial_selection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new EdgesAndLinkedNodes()
        policy.do_selection(hit_test_result, gr, true, false)

        expect(node_source.selected.is_empty()).to.be.true
      })

      it("should select linked nodes if hit_test_result is not empty", () => {
        const hit_test_result = create_empty_hit_test_result()
        hit_test_result.indices = [1]

        const policy = new EdgesAndLinkedNodes()
        policy.do_selection(hit_test_result, gr, true, false)

        expect(node_source.selected.indices).to.be.deep.equal([0, 2])
      })
    })

    describe("do_inspection method", () => {

      it("should clear node inspections if hit_test_result is empty", () => {
        const initial_inspection = create_hit_test_result_from_hits([[0, 0], [1, 0]])
        node_source.inspected = initial_inspection

        const hit_test_result = create_empty_hit_test_result()
        const policy = new EdgesAndLinkedNodes()
        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)

        expect(did_hit).to.be.false
        expect(node_source.inspected.is_empty()).to.be.true
      })

      it("should inspect linked nodes if hit_test_result is not empty", () => {
        const hit_test_result = create_empty_hit_test_result()
        hit_test_result.indices = [1]

        const policy = new EdgesAndLinkedNodes()
        const did_hit = policy.do_inspection(hit_test_result, {type: "point", sx: 0, sy: 0}, gv, true, false)

        expect(did_hit).to.be.true
        expect(node_source.inspected.indices).to.be.deep.equal([0, 2])
      })
    })
  })
})
