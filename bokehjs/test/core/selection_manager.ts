import {expect} from "chai"
import * as sinon from "sinon"

import {Rect} from "models/glyphs/rect"
import {CDSView} from "models/sources/cds_view"
import {IndexFilter} from "models/filters/index_filter"

import {create_hit_test_result_from_hits, create_empty_hit_test_result} from "core/hittest"
import {create_glyph_renderer_view} from "../models/glyphs/glyph_utils"

describe("SelectionManager", () => {

  beforeEach(function() {
    this.glyph = new Rect()
    this.renderer_view = create_glyph_renderer_view(this.glyph, {x: [1, 2, 3]})
    this.glyph_stub = sinon.stub(this.renderer_view.glyph, "hit_test")
  })

  describe("select", () => {

    it("should return true and set source selected if hit_test_result is not empty", function() {
      this.glyph_stub.returns(create_hit_test_result_from_hits([[0, 1]]))
      const source = this.renderer_view.model.data_source

      const did_hit = source.selection_manager.select([this.renderer_view], "geometry", true, false)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.deep.equal([0])
    })

    it("should set source selected correctly with a cds_view", function() {
      // hit-testing is done in subset space, whereas selected should be set in full data space
      this.glyph_stub.returns(create_hit_test_result_from_hits([[0, 1]]))
      const source = this.renderer_view.model.data_source
      const filter = new IndexFilter({indices: [1]})
      this.renderer_view.model.view = new CDSView({filters: [filter]})

      const did_hit = source.selection_manager.select([this.renderer_view], "geometry", true, false)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.deep.equal([1])
    })

    it("should return false and clear selections if hit_test_result is empty", function() {
      this.glyph_stub.returns(create_empty_hit_test_result())
      const source = this.renderer_view.model.data_source
      source.selected.indices = [0, 1]
      expect(source.selected.is_empty()).to.be.false

      const did_hit = source.selection_manager.select([this.renderer_view], "geometry", true, false)
      expect(did_hit).to.be.false
      expect(source.selected.is_empty()).to.be.true
    })
  })

  describe("inspect", function() {

    it("should return true and set source inspected if hit_test result is not empty", function() {
      this.glyph_stub.returns(create_hit_test_result_from_hits([[1, 2]]))
      const source = this.renderer_view.model.data_source

      const did_hit = source.selection_manager.inspect(this.renderer_view, "geometry")
      expect(did_hit).to.be.true
      expect(source.inspected.indices).to.be.deep.equal([1])
    })

    it("should return false and clear inspections if hit_test_result is empty", function() {
      this.glyph_stub.returns(create_empty_hit_test_result())
      const source = this.renderer_view.model.data_source
      source.inspected.indices = [0, 1]
      expect(source.inspected.is_empty()).to.be.false

      const did_hit = source.selection_manager.inspect(this.renderer_view, "geometry")
      expect(did_hit).to.be.false
      expect(source.inspected.is_empty()).to.be.true
    })
  })
})
