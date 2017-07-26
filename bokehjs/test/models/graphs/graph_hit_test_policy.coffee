{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

{build_views} = utils.require("core/build_views")
{create_1d_hit_test_result, create_hit_test_result} = utils.require("core/hittest")
{Selector} = utils.require("core/selector")

{Plot} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")

{LayoutProvider} = utils.require("models/graphs/layout_provider")
{Circle} = utils.require("models/glyphs/circle")
{MultiLine} = utils.require("models/glyphs/multi_line")
{ColumnDataSource} = utils.require("models/sources/column_data_source")
{DataSource} = utils.require("models/sources/data_source")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{GraphRenderer} = utils.require("models/renderers/graph_renderer")
{NodesOnly, NodesAndLinkedEdges} = utils.require("models/graphs/graph_hit_test_policy")

describe "GraphHitTestPolicy", ->

  afterEach ->
    utils.unstub_canvas()

  beforeEach ->
    utils.stub_canvas()

    @plot = new Plot({
       x_range: new Range1d({start: 0, end: 1})
       y_range: new Range1d({start: 0, end: 1})
    })

    @plot_view = new @plot.default_view({model: @plot, parent: null})

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
    @node_renderer = new GlyphRenderer({data_source: @node_source, glyph: new Circle()})
    @edge_renderer = new GlyphRenderer({data_source: @edge_source, glyph: new MultiLine()})

    @gr = new GraphRenderer({node_renderer: @node_renderer, edge_renderer: @edge_renderer, layout_provider: new LayoutProvider()})

    @plot_canvas_view = new @plot.plot_canvas.default_view({model: @plot.plot_canvas, parent: @plot_view})

    @gv = new @gr.default_view({
      model: @gr
      plot_view: @plot_canvas_view
      parent: @plot_canvas_view
    })

  describe "NodesOnly", ->

    afterEach ->
      @gv.node_view.glyph.hit_test.restore()

    beforeEach ->
      @stub = sinon.stub(@gv.node_view.glyph, "hit_test")

    describe "do_selection method", ->

      it "should return false if GlyphView doesn't have hit-testing and returns null", ->
        @stub.returns(null)
        policy = new NodesOnly()
        expect(policy.do_selection("geometry", @gv, true, false)).to.be.false

      it "should return false and clear selections if hit_test result is empty", ->
        initial_selection = create_1d_hit_test_result([[1], [2]])
        @node_source.selected = initial_selection
        @node_source.selection_manager.selector.indices = initial_selection

        @stub.returns(create_hit_test_result())
        policy = new NodesOnly()

        expect(policy.do_selection("geometry", @gv, true, false)).to.be.false
        indices = @node_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.true
        expect(@node_source.selected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        @stub.returns(create_1d_hit_test_result([[0], [1]]))
        policy = new NodesOnly()

        expect(policy.do_selection("geometry", @gv, true, false)).to.be.true
        indices = @node_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.false
        expect(@node_source.selected.is_empty()).to.be.false

    describe "do_inspection method", ->

      beforeEach ->
        @id = @gr.id
        # Have to manually add this. It's normally added selection_manager.inspect
        @node_source.selection_manager.inspectors[@id] = new Selector()

      it "should return false and clear inspections if hit_test result is empty", ->
        initial_inspection = create_1d_hit_test_result([[1], [2]])
        @node_source.inspected = initial_inspection
        @node_source.selection_manager.inspectors[@id].indices = initial_inspection

        @stub.returns(create_hit_test_result())
        policy = new NodesOnly()

        expect(policy.do_inspection("geometry", @gv, true, false)).to.be.false
        indices = @node_source.selection_manager.inspectors[@id].indices
        expect(indices.is_empty()).to.be.true
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        @stub.returns(create_1d_hit_test_result([[0], [1]]))
        policy = new NodesOnly()

        expect(policy.do_inspection("geometry", @gv, true, false)).to.be.true
        indices = @node_source.selection_manager.inspectors[@id].indices
        expect(indices.is_empty()).to.be.false
        expect(@node_source.inspected.is_empty()).to.be.false

  describe "NodesAndLinkedEdges", ->

    afterEach ->
      @gv.node_view.glyph.hit_test.restore()

    beforeEach ->
      @stub = sinon.stub(@gv.node_view.glyph, "hit_test")

    describe "do_selection method", ->

      it "should clear edge selections if hit_test result is empty", ->
        initial_selection = create_hit_test_result()
        initial_selection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.selected = initial_selection
        @edge_source.selection_manager.selector.indices = initial_selection

        @stub.returns(create_hit_test_result())
        policy = new NodesAndLinkedEdges()

        policy.do_selection("geometry", @gv, true, false)

        indices = @edge_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.true
        expect(@edge_source.selected.is_empty()).to.be.true

      it "should select linked edges if hit_Test result is not empty", ->
        @stub.returns(create_1d_hit_test_result([[0], ]))
        policy = new NodesAndLinkedEdges()

        policy.do_selection("geometry", @gv, true, false)

        indices = @edge_source.selection_manager.selector.indices
        expect(indices['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })
        expect(@edge_source.selected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })

    describe "do_inspection method", ->

      beforeEach ->
        @id = @gr.id
        # Have to manually add this. It's normally added selection_manager.inspect
        @node_source.selection_manager.inspectors[@id] = new Selector()

      it "should clear edge inspections if hit_test result is empty", ->
        @edge_source.selection_manager.inspectors[@edge_renderer.id] = new Selector()

        initial_inspection = create_hit_test_result()
        initial_inspection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.inspected = initial_inspection
        @edge_source.selection_manager.inspectors[@edge_renderer.id].indices = initial_inspection

        @stub.returns(create_hit_test_result())
        policy = new NodesAndLinkedEdges()

        policy.do_inspection("geometry", @gv, true, false)

        indices = @edge_source.selection_manager.inspectors[@edge_renderer.id].indices

        expect(indices.is_empty()).to.be.true
        expect(@edge_source.inspected.is_empty()).to.be.true

      it "should select linked edges if hit_Test result is not empty", ->
        @edge_source.selection_manager.inspectors[@edge_renderer.id] = new Selector()

        @stub.returns(create_1d_hit_test_result([[0], ]))
        policy = new NodesAndLinkedEdges()

        policy.do_inspection("geometry", @gv, true, false)

        indices = @edge_source.selection_manager.inspectors[@edge_renderer.id].indices
        expect(indices['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })
        expect(@edge_source.inspected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })
