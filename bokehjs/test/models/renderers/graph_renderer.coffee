{expect} = require "chai"
utils = require "../../utils"

{create_1d_hit_test_result, create_hit_test_result} = utils.require("core/hittest")
{Selector} = utils.require("core/selector")

{ColumnDataSource} = utils.require("models/sources/column_data_source")
{DataSource} = utils.require("models/sources/data_source")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{GraphRenderer} = utils.require("models/renderers/graph_renderer")

describe "GraphRenderer", ->

  beforeEach ->
    @node_source = new ColumnDataSource({
      data: {
        index: [10, 20, 30, 40],
      }
    })
    @edge_source = new ColumnDataSource({
      data: {
        start: [10, 10, 30],
        end: [20, 30, 20],
      }
    })
    @node_renderer = new GlyphRenderer({data_source: @node_source})
    @edge_renderer = new GlyphRenderer({data_source: @edge_source})

    @gr = new GraphRenderer({node_renderer: @node_renderer, edge_renderer: @edge_renderer})

  describe "hit_test_helper", ->

    ## Dummy GlyphView classes that implement `hit_test` method
    class HitTestNotImplemented
      hit_test: (geometry) -> return null

    class HitTestMiss
      hit_test: (geometry) -> return create_1d_hit_test_result([])

    class HitTestHit
      hit_test: (geometry) -> return create_1d_hit_test_result([[0], [1]])

    it "should return false if @visible is false", ->
      @gr.visible = false
      node_view = new HitTestHit()
      expect(@gr.hit_test_helper("geometry", node_view, true, false, "select")).to.be.false

    it "should return false if GlyphView doesn't have hit-testing and returns null", ->
      node_view = new HitTestNotImplemented()
      expect(@gr.hit_test_helper("geometry", node_view, true, false, "select")).to.be.false

    describe "mode='select'", ->

      it "should return false and clear selections if hit_test result is empty", ->
        initial_selection = create_1d_hit_test_result([1,2])
        @node_source.selected = initial_selection
        @node_source.selection_manager.selector.indices = initial_selection

        node_view = new HitTestMiss()
        expect(@gr.hit_test_helper("geometry", node_view, true, false, "select")).to.be.false
        indices = @node_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.true
        expect(@node_source.selected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        node_view = new HitTestHit()
        expect(@gr.hit_test_helper("geometry", node_view, true, false, "select")).to.be.true
        indices = @node_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.false
        expect(@node_source.selected.is_empty()).to.be.false

      describe "selection_mode='linked'", ->

        it "should clear edge selections if hit_test result is empty", ->
          initial_selection = create_hit_test_result()
          initial_selection["2d"].indices = {0: [0, 1], 1: [0]}
          @edge_source.selected = initial_selection
          @edge_source.selection_manager.selector.indices = initial_selection

          # todo: test that miss clears the selection indices
          node_view = new HitTestMiss()
          @gr.selection_mode = "linked"
          @gr.hit_test_helper("geometry", node_view, true, false, "select")

          indices = @edge_source.selection_manager.selector.indices

          expect(indices.is_empty()).to.be.true
          expect(@edge_source.selected.is_empty()).to.be.true

        it "should select linked edges if hit_Test result is not empty", ->
          node_view = new HitTestHit()
          @gr.selection_mode = "linked"
          @gr.hit_test_helper("geometry", node_view, true, false, "select")

          indices = @edge_source.selection_manager.selector.indices
          expect(indices.is_empty()).to.be.false
          expect(@edge_source.selected.is_empty()).to.be.false

    describe "mode='inspect'", ->

      beforeEach ->
        @id = @gr.id
        # Have to manually add this. It's normally added selection_manager.inspect
        @node_source.selection_manager.inspectors[@id] = new Selector()

      it "should return false and clear inspections if hit_test result is empty", ->
        initial_inspection = create_1d_hit_test_result([1,2])
        @node_source.inspected = initial_inspection
        @node_source.selection_manager.inspectors[@id].indices = initial_inspection

        node_view = new HitTestMiss()
        expect(@gr.hit_test_helper("geometry", node_view, true, false, "inspect")).to.be.false
        indices = @node_source.selection_manager.inspectors[@id].indices
        expect(indices.is_empty()).to.be.true
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        node_view = new HitTestHit()
        expect(@gr.hit_test_helper("geometry", node_view, true, false, "inspect")).to.be.true
        indices = @node_source.selection_manager.inspectors[@id].indices
        expect(indices.is_empty()).to.be.false
        expect(@node_source.inspected.is_empty()).to.be.false

      describe "inspection_mode='linked'", ->

        it "should clear edge inspections if hit_test result is empty", ->
          @edge_source.selection_manager.inspectors[@edge_renderer.id] = new Selector()

          initial_inspection = create_hit_test_result()
          initial_inspection["2d"].indices = {0: [0, 1], 1: [0]}
          @edge_source.inspected = initial_inspection
          @edge_source.selection_manager.inspectors[@edge_renderer.id].indices = initial_inspection

          # todo: test that miss clears the selection indices
          node_view = new HitTestMiss()
          @gr.inspection_mode = "linked"
          @gr.hit_test_helper("geometry", node_view, true, false, "inspect")

          indices = @edge_source.selection_manager.inspectors[@edge_renderer.id].indices

          expect(indices.is_empty()).to.be.true
          expect(@edge_source.inspected.is_empty()).to.be.true

        it "should select linked edges if hit_Test result is not empty", ->
          @edge_source.selection_manager.inspectors[@edge_renderer.id] = new Selector()

          node_view = new HitTestHit()
          @gr.selection_mode = "linked"
          @gr.hit_test_helper("geometry", node_view, true, false, "select")

          indices = @edge_source.selection_manager.selector.indices
          expect(indices.is_empty()).to.be.false
          expect(@edge_source.selected.is_empty()).to.be.false
