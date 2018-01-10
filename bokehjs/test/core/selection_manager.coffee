{expect} = require "chai"
sinon = require "sinon"
utils = require "../utils"

{Selection} = utils.require("models/selections/selection")
{ColumnDataSource} = utils.require("models/sources/column_data_source")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{Rect, RectView} = utils.require("models/glyphs/rect")
{CDSView} = utils.require("models/sources/cds_view")
{IndexFilter} = utils.require("models/filters/index_filter")

{create_hit_test_result_from_hits, create_empty_hit_test_result} = utils.require("core/hittest")
{create_glyph_view} = require("../models/glyphs/glyph_utils")

describe "SelectionManager", ->

  afterEach ->
    utils.unstub_canvas()

  beforeEach ->
    utils.stub_canvas()
    @glyph = new Rect()
    @renderer_view = create_glyph_view(@glyph, {'x': [1, 2, 3]}, true)
    @glyph_stub = sinon.stub(@renderer_view.glyph, "hit_test")

  describe "select", ->

    it "should return true and set source selected if hit_test_result is not empty", ->
      @glyph_stub.returns(create_hit_test_result_from_hits([[0, 1]]))
      source = @renderer_view.model.data_source

      did_hit = source.selection_manager.select([@renderer_view], "geometry", true, false)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.deep.equal([0])

    it "should set source selected correctly with a cds_view", ->
      # hit-testing is done in subset space, whereas selected should be set in full data space
      @glyph_stub.returns(create_hit_test_result_from_hits([[0, 1]]))
      source = @renderer_view.model.data_source
      filter = new IndexFilter({'indices': [1]})
      @renderer_view.model.view = new CDSView({'filters': [filter]})

      did_hit = source.selection_manager.select([@renderer_view], "geometry", true, false)
      expect(did_hit).to.be.true
      expect(source.selected.indices).to.be.deep.equal([1])

    it "should return false and clear selections if hit_test_result is empty", ->
      @glyph_stub.returns(create_empty_hit_test_result())
      source = @renderer_view.model.data_source
      source.selected.indices = [0, 1]
      expect(source.selected.is_empty()).to.be.false

      did_hit = source.selection_manager.select([@renderer_view], "geometry", true, false)
      expect(did_hit).to.be.false
      expect(source.selected.is_empty()).to.be.true

  describe "inspect", ->

    it "should return true and set source inspected if hit_test result is not empty", ->
      @glyph_stub.returns(create_hit_test_result_from_hits([[1, 2]]))
      source = @renderer_view.model.data_source

      did_hit = source.selection_manager.inspect(@renderer_view, "geometry")
      expect(did_hit).to.be.true
      expect(source.inspected.indices).to.be.deep.equal([1])

    it "should return false and clear inspections if hit_test_result is empty", ->
      @glyph_stub.returns(create_empty_hit_test_result())
      source = @renderer_view.model.data_source
      source.inspected.indices = [0, 1]
      expect(source.inspected.is_empty()).to.be.false

      did_hit = source.selection_manager.inspect(@renderer_view, "geometry")
      expect(did_hit).to.be.false
      expect(source.inspected.is_empty()).to.be.true
