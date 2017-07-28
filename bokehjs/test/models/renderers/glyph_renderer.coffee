{expect} = require "chai"
utils = require "../../utils"

{create_1d_hit_test_result} = utils.require("core/hittest")
{Selector} = utils.require("core/selector")

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{DataSource} = utils.require("models/sources/data_source")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")

describe "GlyphRenderer", ->

  beforeEach ->
    @source = new ColumnDataSource({
      data: {
        x: [10, 20, 30, 40],
        y:[1, 2, 3, 4],
        color: ['red', 'green', 'red', 'green'],
        label: ['foo', 'bar', 'foo', 'bar']
      }
    })
    @gr = new GlyphRenderer({'data_source': @source})

  describe "get_reference_point", ->

    it "should return 0 if no field, value is passed", ->
      index = @gr.get_reference_point()
      expect(index).to.be.equal 0

    it "should return 0 if field not in column data source", ->
      index = @gr.get_reference_point('milk', 'bar')
      expect(index).to.be.equal 0

    it "should return correct index if field and value in column data source", ->
      index = @gr.get_reference_point('label', 'bar')
      expect(index).to.be.equal 1

    it "should return 0 index if field in column data source but value not available", ->
      index = @gr.get_reference_point('label', 'baz')
      expect(index).to.be.equal 0

    it "should return 0 if data_source doesn't have get_column method", ->
      source = new DataSource()
      gr = new GlyphRenderer({'data_source': source})
      index = gr.get_reference_point('label', 20)
      expect(index).to.be.equal 0

  # describe "hit_test_helper", ->
  #
  #   ## Dummy GlyphView classes that implement `hit_test` method
  #   class HitTestNotImplemented
  #     hit_test: (geometry) -> return null
  #
  #   class HitTestMiss
  #     hit_test: (geometry) -> return create_1d_hit_test_result([])
  #
  #   class HitTestHit
  #     hit_test: (geometry) -> return create_1d_hit_test_result([[0], [1]])
  #
  #   it "should return false if @visible is false", ->
  #     @gr.visible = false
  #     glyph_view = new HitTestHit()
  #     expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "select")).to.be.false
  #
  #   it "should return false if GlyphView doesn't have hit-testing and returns null", ->
  #     glyph_view = new HitTestNotImplemented()
  #     expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "select")).to.be.false
  #
  #   describe "mode='select'", ->
  #
  #     it "should return false and clear selections if hit_test result is empty", ->
  #       initial_selection = create_1d_hit_test_result([1,2])
  #       @source.selected = initial_selection
  #       @source.selection_manager.selector.indices = initial_selection
  #
  #       glyph_view = new HitTestMiss()
  #       expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "select")).to.be.false
  #       indices = @source.selection_manager.selector.indices
  #       expect(indices.is_empty()).to.be.true
  #       expect(@source.selected.is_empty()).to.be.true
  #
  #     it "should return true if hit_test result is not empty", ->
  #       glyph_view = new HitTestHit()
  #       expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "select")).to.be.true
  #       indices = @source.selection_manager.selector.indices
  #       expect(indices.is_empty()).to.be.false
  #       expect(@source.selected.is_empty()).to.be.false
  #
  #   describe "mode='inspect'", ->
  #
  #     beforeEach ->
  #       @id = @gr.id
  #       # Have to manually add this. It's normally added selection_manager.inspect
  #       @source.selection_manager.inspectors[@id] = new Selector()
  #
  #     it "should return false and clear inspections if hit_test result is empty", ->
  #       initial_inspection = create_1d_hit_test_result([1,2])
  #       @source.inspected = initial_inspection
  #       @source.selection_manager.inspectors[@id].indices = initial_inspection
  #
  #       glyph_view = new HitTestMiss()
  #       expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "inspect")).to.be.false
  #       indices = @source.selection_manager.inspectors[@id].indices
  #       expect(indices.is_empty()).to.be.true
  #       expect(@source.inspected.is_empty()).to.be.true
  #
  #     it "should return true if hit_test result is not empty", ->
  #       glyph_view = new HitTestHit()
  #       expect(@gr.hit_test_helper("geometry", glyph_view, true, false, "inspect")).to.be.true
  #       indices = @source.selection_manager.inspectors[@id].indices
  #       expect(indices.is_empty()).to.be.false
  #       expect(@source.inspected.is_empty()).to.be.false
