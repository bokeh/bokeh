import {expect} from "assertions"
import * as sinon from "sinon"

import {Rect} from "@bokehjs/models/glyphs/rect"
import {CDSView} from "@bokehjs/models/sources/cds_view"
import {Selection} from "@bokehjs/models/selections/selection"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"

import {create_glyph_renderer_view} from "../models/glyphs/_util"

describe("SelectionManager", () => {
  async function make_glyph() {
    const glyph = new Rect()
    const renderer_view = await create_glyph_renderer_view(glyph, {x: [1, 2, 3]})
    const glyph_stub = sinon.stub(renderer_view.glyph, "hit_test")
    return {glyph, renderer_view, glyph_stub}
  }

  describe("select", () => {

    it("should return true and set source selected if hit_test_result is not empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(new Selection({indices: [0]}))
      const source = renderer_view.model.data_source

      const did_hit = source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.equal([0])
    })

    it("should set source selected correctly with a cds_view", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      // hit-testing is done in subset space, whereas selected should be set in full data space
      glyph_stub.returns(new Selection({indices: [0]}))
      const source = renderer_view.model.data_source
      const filter = new IndexFilter({indices: [1]})
      renderer_view.model.view = new CDSView({filter})

      const did_hit = source.selection_manager.select([renderer_view], {type: "point", sx: 0, sy: 0}, true)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.equal([1])
    })

    it("should return false and clear selections if hit_test_result is empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(new Selection())
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

      glyph_stub.returns(new Selection({indices: [1]}))
      const source = renderer_view.model.data_source

      const did_hit = source.selection_manager.inspect(renderer_view, {type: "point", sx: 0, sy: 0})
      expect(did_hit).to.be.true
      expect(source.inspected.indices).to.be.equal([1])
    })

    it("should return false and clear inspections if hit_test_result is empty", async () => {
      const {renderer_view, glyph_stub} = await make_glyph()

      glyph_stub.returns(new Selection())
      const source = renderer_view.model.data_source
      source.inspected.indices = [0, 1]
      expect(source.inspected.is_empty()).to.be.false

      const did_hit = source.selection_manager.inspect(renderer_view, {type: "point", sx: 0, sy: 0})
      expect(did_hit).to.be.false
      expect(source.inspected.is_empty()).to.be.true
    })
  })
})
