{expect} = require "chai"
sinon = require "sinon"
utils = require "../../utils"

{build_views} = utils.require("core/build_views")
{create_1d_hit_test_result, create_hit_test_result} = utils.require("core/hittest")
{Selector} = utils.require("core/selector")

{Plot} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")

{Circle} = utils.require("models/glyphs/circle")
{MultiLine} = utils.require("models/glyphs/multi_line")
{NodesOnly, NodesAndLinkedEdges, EdgesAndLinkedNodes} = utils.require("models/graphs/graph_hit_test_policy")
{LayoutProvider} = utils.require("models/graphs/layout_provider")
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{GraphRenderer} = utils.require("models/renderers/graph_renderer")
{ColumnDataSource} = utils.require("models/sources/column_data_source")


describe "GraphHitTestPolicy", ->

  afterEach ->
    utils.unstub_canvas()
    @gv.node_view.glyph.hit_test.restore()
    @gv.edge_view.glyph.hit_test.restore()

  beforeEach ->
    utils.stub_canvas()

    @plot = new Plot({
       x_range: new Range1d({start: 0, end: 1})
       y_range: new Range1d({start: 0, end: 1})
    })
    @plot_view = new @plot.default_view({model: @plot, parent: null})
    @plot_canvas_view = new @plot.plot_canvas.default_view({model: @plot.plot_canvas, parent: @plot_view})

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

    @gr = new GraphRenderer({
      node_renderer: @node_renderer
      edge_renderer: @edge_renderer
      layout_provider: new LayoutProvider()
    })

    @gv = new @gr.default_view({
      model: @gr
      plot_view: @plot_canvas_view
      parent: @plot_canvas_view
    })

    @node_stub = sinon.stub(@gv.node_view.glyph, "hit_test")
    @edge_stub = sinon.stub(@gv.edge_view.glyph, "hit_test")

  describe "NodesOnly", ->

    describe "do_selection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.selector

      it "should return false if GlyphView doesn't have hit-testing and returns null", ->
        @node_stub.returns(null)
        policy = new NodesOnly()
        expect(policy.do_selection("geometry", @gv, true, false)).to.be.false

      it "should return false and clear selections if hit_test result is empty", ->
        initial_selection = create_1d_hit_test_result([[1], [2]])
        @node_source.selected = initial_selection
        @node_selector.indices = initial_selection

        @node_stub.returns(create_hit_test_result())
        policy = new NodesOnly()
        did_hit = policy.do_selection("geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@node_selector.indices.is_empty()).to.be.true
        expect(@node_source.selected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        @node_stub.returns(create_1d_hit_test_result([[0], [1]]))
        policy = new NodesOnly()

        expect(policy.do_selection("geometry", @gv, true, false)).to.be.true
        indices = @node_source.selection_manager.selector.indices
        expect(indices.is_empty()).to.be.false
        expect(@node_source.selected.is_empty()).to.be.false

    describe "do_inspection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.get_or_create_inspector(@node_renderer)

      it "should return false and clear inspections if hit_test result is empty", ->
        # create initial inspection to clear
        initial_inspection = create_1d_hit_test_result([[1], [2]])
        @node_selector.indices = initial_inspection
        @node_source.inspected = initial_inspection

        @node_stub.returns(create_hit_test_result())
        policy = new NodesOnly()
        did_hit = policy.do_inspection("geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@node_selector.indices.is_empty()).to.be.true
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should return true if hit_test result is not empty", ->
        @node_stub.returns(create_1d_hit_test_result([[0], [1]]))
        policy = new NodesOnly()

        did_hit = policy.do_inspection("geometry", @gv, true, false)
        expect(did_hit).to.be.true
        expect(@node_selector.indices.is_empty()).to.be.false
        expect(@node_source.inspected.is_empty()).to.be.false

  describe "NodesAndLinkedEdges", ->

    describe "do_selection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.selector
        @edge_selector = @edge_source.selection_manager.selector

      it "should clear edge selections if hit_test result is empty", ->
        # create initial inspection to clear
        initial_selection = create_hit_test_result()
        initial_selection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.selected = initial_selection
        @edge_selector.indices = initial_selection

        @node_stub.returns(create_hit_test_result())
        policy = new NodesAndLinkedEdges()
        policy.do_selection("geometry", @gv, true, false)

        expect(@edge_selector.indices.is_empty()).to.be.true
        expect(@edge_source.selected.is_empty()).to.be.true

      it "should select linked edges if hit_Test result is not empty", ->
        @node_stub.returns(create_1d_hit_test_result([[0], ]))
        policy = new NodesAndLinkedEdges()

        policy.do_selection("geometry", @gv, true, false)

        indices = @edge_source.selection_manager.selector.indices
        expect(indices['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })
        expect(@edge_source.selected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })

    describe "do_inspection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.get_or_create_inspector(@node_renderer)
        @edge_selector = @edge_source.selection_manager.get_or_create_inspector(@edge_renderer)

      it "should clear edge inspections if hit_test result is empty", ->
        # create initial inspection to clear
        initial_inspection = create_hit_test_result()
        initial_inspection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.inspected = initial_inspection
        @edge_selector.indices = initial_inspection

        @node_stub.returns(create_hit_test_result())
        policy = new NodesAndLinkedEdges()
        did_hit = policy.do_inspection("geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@edge_selector.indices.is_empty()).to.be.true
        expect(@edge_source.inspected.is_empty()).to.be.true

      it "should select linked edges if hit_test result is not empty", ->
        @node_stub.returns(create_1d_hit_test_result([[0], ]))
        policy = new NodesAndLinkedEdges()
        did_hit = policy.do_inspection("geometry", @gv, true, false)

        expect(did_hit).to.be.true
        expect(@edge_selector.indices['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })
        expect(@edge_source.inspected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })

  describe "EdgedAndLinkedNodes", ->

    describe "do_selection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.selector
        @edge_selector = @edge_source.selection_manager.selector

      it "should clear node selections if hit_test result is empty", ->
        initial_selection = create_hit_test_result()
        initial_selection["1d"].indices = [0, 1]
        @node_source.selected = initial_selection
        @node_selector.indices = initial_selection

        @edge_stub.returns(create_hit_test_result())
        policy = new EdgesAndLinkedNodes()
        policy.do_selection("geometry", @gv, true, false)

        expect(@node_selector.indices.is_empty()).to.be.true
        expect(@node_source.selected.is_empty()).to.be.true

      it "should select linked nodes if hit_test result is not empty", ->
        hit_test_result = create_hit_test_result()
        hit_test_result['2d'].indices = {1: [0]}
        @edge_stub.returns(hit_test_result)

        policy = new EdgesAndLinkedNodes()
        policy.do_selection("geometry", @gv, true, false)

        expect(@node_selector.indices['1d'].indices).to.be.deep.equal( [0, 2] )
        expect(@node_source.selected['1d'].indices).to.be.deep.equal( [0, 2] )

    describe "do_inspection method", ->

      beforeEach ->
        @node_selector = @node_source.selection_manager.get_or_create_inspector(@node_renderer)
        @edge_selector = @edge_source.selection_manager.get_or_create_inspector(@edge_renderer)

      it "should clear node inspections if hit_test result is empty", ->
        initial_inspection = create_1d_hit_test_result([[0], [1]])
        @node_source.inspected = initial_inspection
        @node_selector.indices = initial_inspection

        @edge_stub.returns(create_hit_test_result())
        policy = new EdgesAndLinkedNodes()
        did_hit = policy.do_inspection("geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@node_selector.indices.is_empty()).to.be.true
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should inspect linked nodes if hit_Test result is not empty", ->
        hit_test_result = create_hit_test_result()
        hit_test_result['2d'].indices = {1: [0]}

        @edge_stub.returns(hit_test_result)
        policy = new EdgesAndLinkedNodes()
        did_hit = policy.do_inspection("geometry", @gv, true, false)

        expect(did_hit).to.be.true
        expect(@node_selector.indices['1d'].indices).to.be.deep.equal( [0, 2] )
        expect(@node_source.inspected['1d'].indices).to.be.deep.equal( [0, 2] )
