import {expect} from "#framework/assertions"
import * as sinon from "sinon"

import {Rect} from "@bokehjs/models/glyphs/rect"
import {DataView} from "@bokehjs/models/sources/data_view"
import {Selection} from "@bokehjs/models/selections/selection"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {GraphRenderer} from "@bokehjs/models/renderers/graph_renderer"
import type {GraphRendererView} from "@bokehjs/models/renderers/graph_renderer"
import {GraphSelectionPolicy} from "@bokehjs/models/selections/interaction_policy"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

import {create_glyph_renderer_view} from "../models/glyphs/_util"

describe("SelectionManager", () => {
  async function make_glyph() {
    const glyph = Rect.create()
    const renderer_view = await create_glyph_renderer_view(glyph, {x: [1, 2, 3]})
    const glyph_stub = sinon.stub(renderer_view.glyph, "hit_test")
    return {glyph, renderer_view, glyph_stub}
  }

  describe("select", () => {

    it("should return true and set source selected if hit_test_result is not empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(Selection.create({indices: [0]}))
      const source = renderer_view.model.data_source

      const did_hit = source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.equal([0])
    })

    it("should set source selected correctly with a data_view", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      // hit-testing is done in subset space, whereas selected should be set in full data space
      glyph_stub.returns(Selection.create({indices: [0]}))
      const source = renderer_view.model.data_source
      const filter = IndexFilter.create({indices: [1]})
      renderer_view.model.view = DataView.create({filter})

      const did_hit = source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.equal([1])
    })

    it("should apply graph toggle mode to direct hits before policy expansion", () => {
      const source = GraphDataSource.create({
        nodes: ["A", "B", "C", "D"],
        edges: [["A", "B"], ["A", "C"], ["B", "D"]],
        selection_policy: GraphSelectionPolicy.create({node_hops: 1, node_direction: "out"}),
      })
      const graph = GraphRenderer.create({data_source: source})
      let direct = Selection.create({indices: [0]})
      const renderer_view = {
        model: graph,
        node_view: {model: graph.node_renderer, hit_test: () => direct},
        edge_view: {model: graph.edge_renderer},
      } as unknown as GraphRendererView

      source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true, "toggle")
      expect(source.selected.nodes.indices).to.be.equal([0])
      expect(source.nodes.selected.indices).to.be.equal([0, 1, 2])

      direct = Selection.create({indices: [1]})
      source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true, "toggle")
      expect(source.selected.nodes.indices).to.be.equal([1])
      expect(source.nodes.selected.indices).to.be.equal([1, 3])

      source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true, "toggle")
      expect(source.selected.nodes.indices).to.be.equal([])
      expect(source.nodes.selected.indices).to.be.equal([])
    })

    it("should expand programmatic direct graph selections", () => {
      const source = GraphDataSource.create({
        nodes: ["A", "B", "C"],
        edges: [["A", "B"], ["A", "C"]],
        selection_policy: GraphSelectionPolicy.create({node_direction: "out"}),
      })

      source.selected.nodes.indices = [0]
      expect(source.nodes.selected.indices).to.be.equal([0])

      source.selection_policy.node_hops = 1
      expect(source.nodes.selected.indices).to.be.equal([0, 1, 2])
    })

    it("should return false and clear selections if hit_test_result is empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(Selection.create())
      const source = renderer_view.model.data_source
      source.selected.indices = [0, 1]
      expect(source.selected.is_empty()).to.be.false

      const did_hit = source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true)
      expect(did_hit).to.be.false
      expect(source.selected.is_empty()).to.be.true
    })
  })

  describe("inspect", () => {

    it("should return true and set source inspected if hit_test result is not empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(Selection.create({indices: [1]}))
      const source = renderer_view.model.data_source

      const did_hit = source.selection_manager.inspect(renderer_view, {type: "point", sx: 0, sy: 0})
      expect(did_hit).to.be.true
      expect(source.inspected.indices).to.be.equal([1])
    })

    it("should return false and clear inspections if hit_test_result is empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(Selection.create())
      const source = renderer_view.model.data_source
      source.inspected.indices = [0, 1]
      expect(source.inspected.is_empty()).to.be.false

      const did_hit = source.selection_manager.inspect(renderer_view, {type: "point", sx: 0, sy: 0})
      expect(did_hit).to.be.false
      expect(source.inspected.is_empty()).to.be.true
    })

    it("should emit one direct graph inspection while updating expanded components", () => {
      const source = GraphDataSource.create({nodes: [0, 1], edges: [[0, 1]]})
      const inspection_policy = GraphSelectionPolicy.create({include_incident_edges: true})
      const graph = GraphRenderer.create({data_source: source, inspection_policy})
      const direct = Selection.create({indices: [0]})
      const renderer_view = {
        model: graph,
        node_view: {model: graph.node_renderer, hit_test: () => direct},
        edge_view: {model: graph.edge_renderer},
      } as unknown as GraphRendererView
      let node_events = 0
      let edge_events = 0
      source.nodes.inspect.connect(() => node_events++)
      source.edges.inspect.connect(() => edge_events++)

      const did_hit = source.selection_manager.inspect(renderer_view, {type: "point", sx: 0, sy: 0})

      expect(did_hit).to.be.true
      expect(source.nodes.inspected.indices).to.be.equal([0])
      expect(source.edges.inspected.indices).to.be.equal([0])
      expect(node_events).to.be.equal(1)
      expect(edge_events).to.be.equal(0)
    })
  })
})
