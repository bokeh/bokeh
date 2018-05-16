{expect} = require "chai"
sinon = require "sinon"

{build_views} = require("core/build_views")
{create_hit_test_result_from_hits, create_empty_hit_test_result} = require("core/hittest")

{Selection} = require("models/selections/selection")
{Plot} = require("models/plots/plot")
{Range1d} = require("models/ranges/range1d")

{Circle} = require("models/glyphs/circle")
{MultiLine} = require("models/glyphs/multi_line")
{NodesOnly, NodesAndLinkedEdges, EdgesAndLinkedNodes} = require("models/graphs/graph_hit_test_policy")
{LayoutProvider} = require("models/graphs/layout_provider")
{GlyphRenderer} = require("models/renderers/glyph_renderer")
{GraphRenderer} = require("models/renderers/graph_renderer")
{ColumnDataSource} = require("models/sources/column_data_source")
{Document} = require "document"

class TrivialLayoutProvider extends LayoutProvider

  get_node_coordinates: (source) ->
    return [[], []]

  get_edge_coordinates: (source) ->
    return [[], []]

describe "GraphHitTestPolicy", ->

  afterEach ->
    @gv.node_view.glyph.hit_test.restore()
    @gv.edge_view.glyph.hit_test.restore()

  beforeEach ->
    doc = new Document()

    @plot = new Plot({
       x_range: new Range1d({start: 0, end: 1})
       y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(@plot)
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
      layout_provider: new TrivialLayoutProvider()
    })

    @gv = new @gr.default_view({
      model: @gr
      plot_view: @plot_canvas_view
      parent: @plot_canvas_view
    })

    @node_stub = sinon.stub(@gv.node_view.glyph, "hit_test")
    @edge_stub = sinon.stub(@gv.edge_view.glyph, "hit_test")

  describe "NodesOnly", ->

    describe "hit_test method", ->

      it "should return null if GlyphView doesn't have hit-testing and returns null", ->
        @node_stub.returns(null)
        policy = new NodesOnly()
        expect(policy.hit_test("geometry", @gv)).to.be.null

      it "should return the Selection that the GlyphView hit-testing returns", ->
        @node_stub.returns(new Selection({indices: [1, 2, 3]}))
        policy = new NodesOnly()
        expect(policy.hit_test("geometry", @gv).indices).to.be.deep.equal([1, 2, 3])

    describe "do_selection method", ->

      it "should return false if called with null hit_test_result", ->
        policy = new NodesOnly()
        expect(policy.do_selection(null, @gr, true, false)).to.be.false

      it "should return false and clear selections if hit_test_result is empty", ->
        initial_selection = create_hit_test_result_from_hits([[1], [2]])
        @node_source.selected = initial_selection

        hit_test_result = create_empty_hit_test_result()
        policy = new NodesOnly()
        did_hit = policy.do_selection(hit_test_result, @gr, true, false)

        expect(did_hit).to.be.false
        expect(@node_source.selected.is_empty()).to.be.true

      it "should return true if hit_test_result is not empty", ->
        hit_test_result = create_hit_test_result_from_hits([[0], [1]])
        policy = new NodesOnly()

        expect(policy.do_selection(hit_test_result, @gr, true, false)).to.be.true
        expect(@node_source.selected.is_empty()).to.be.false

    describe "do_inspection method", ->

      it "should return false and clear inspections if hit_test_result is empty", ->
        # create initial inspection to clear
        initial_inspection = create_hit_test_result_from_hits([[1], [2]])
        @node_source.inspected = initial_inspection

        hit_test_result = create_empty_hit_test_result()
        policy = new NodesOnly()
        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should return true if hit_test_result is not empty", ->
        hit_test_result = create_hit_test_result_from_hits([[0], [1]])
        policy = new NodesOnly()

        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)
        expect(did_hit).to.be.true
        expect(@node_source.inspected.is_empty()).to.be.false

  describe "NodesAndLinkedEdges", ->

    describe "do_selection method", ->

      it "should clear edge selections if hit_test_result is empty", ->
        # create initial inspection to clear
        initial_selection = create_empty_hit_test_result()
        initial_selection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.selected = initial_selection

        hit_test_result = create_empty_hit_test_result()
        policy = new NodesAndLinkedEdges()
        policy.do_selection(hit_test_result, @gr, true, false)

        expect(@edge_source.selected.is_empty()).to.be.true

      it "should select linked edges if hit_test_result is not empty", ->
        hit_test_result = create_hit_test_result_from_hits([[0], ])
        policy = new NodesAndLinkedEdges()

        policy.do_selection(hit_test_result, @gr, true, false)

        expect(@edge_source.selected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })

    describe "do_inspection method", ->

      it "should clear edge inspections if hit_test_result is empty", ->
        # create initial inspection to clear
        initial_inspection = create_empty_hit_test_result()
        initial_inspection["2d"].indices = {0: [0, 1], 1: [0]}
        @edge_source.inspected = initial_inspection

        hit_test_result = create_empty_hit_test_result()
        policy = new NodesAndLinkedEdges()
        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@edge_source.inspected.is_empty()).to.be.true

      it "should select linked edges if hit_test_result is not empty", ->
        hit_test_result = create_hit_test_result_from_hits([[0], ])
        policy = new NodesAndLinkedEdges()
        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)

        expect(did_hit).to.be.true
        expect(@edge_source.inspected['2d'].indices).to.be.deep.equal({ '0': [ 0 ], '1': [ 0 ] })

  describe "EdgedAndLinkedNodes", ->

    describe "do_selection method", ->

      it "should clear node selections if hit_test result is empty", ->
        initial_selection = create_empty_hit_test_result()
        initial_selection["1d"].indices = [0, 1]
        @node_source.selected = initial_selection

        hit_test_result = create_empty_hit_test_result()
        policy = new EdgesAndLinkedNodes()
        policy.do_selection(hit_test_result, @gr, true, false)

        expect(@node_source.selected.is_empty()).to.be.true

      it "should select linked nodes if hit_test_result is not empty", ->
        hit_test_result = create_empty_hit_test_result()
        hit_test_result.indices = [1]

        policy = new EdgesAndLinkedNodes()
        policy.do_selection(hit_test_result, @gr, true, false)

        expect(@node_source.selected.indices).to.be.deep.equal( [0, 2] )

    describe "do_inspection method", ->

      it "should clear node inspections if hit_test_result is empty", ->
        initial_inspection = create_hit_test_result_from_hits([[0], [1]])
        @node_source.inspected = initial_inspection

        hit_test_result = create_empty_hit_test_result()
        policy = new EdgesAndLinkedNodes()
        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)

        expect(did_hit).to.be.false
        expect(@node_source.inspected.is_empty()).to.be.true

      it "should inspect linked nodes if hit_test_result is not empty", ->
        hit_test_result = create_empty_hit_test_result()
        hit_test_result.indices = [1]

        policy = new EdgesAndLinkedNodes()
        did_hit = policy.do_inspection(hit_test_result, "geometry", @gv, true, false)

        expect(did_hit).to.be.true
        expect(@node_source.inspected.indices).to.be.deep.equal( [0, 2] )
