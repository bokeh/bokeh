{expect} = require "chai"
utils = require "../../utils"

{StaticLayoutProvider} = utils.require("models/graphs/static_layout_provider")
{GraphDataSource} = utils.require("models/graphs/graph_data_source")
# {Glyph} = utils.require("models/glyphs/glyph")
# {GlyphRenderer} = utils.require("models/renderers/glyph_renderer")

describe "StaticLayoutProvider", ->

  describe "default props", ->

    it "should create an empty dict", ->
      layout_provider = new StaticLayoutProvider()
      expect(layout_provider.graph_layout).to.be.deep.equal({})

  describe "graph component layout methods", ->

    before ->
      @graph_source = new GraphDataSource()
      @graph_source.nodes.data.index = [0,1,2,3,4]
      # @graph_source.edges.data.start = [1,1,1]
      # @graph_source.edges.data.end = [2,3,4]

      graph_layout = {0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1]}
      @layout_provider = new StaticLayoutProvider({graph_layout: graph_layout})

    it "get_node_coordinates hould correctly return node coords", ->

      [xs, ys] = @layout_provider.get_node_coordinates(@graph_source)
      expect(xs).to.be.deep.equal([1,2,3])
  # beforeEach ->
  #   @source = new ColumnDataSource({
  #     data: {
  #       x: [10, 20, 30, 40],
  #       y:[1, 2, 3, 4],
  #       color: ['red', 'green', 'red', 'green'],
  #       label: ['foo', 'bar', 'foo', 'bar']
  #     }
  #   })
  #   @gr = new GlyphRenderer({'data_source': @source})
  #
  # describe "get_reference_point", ->
  #
  #   it "should return 0 if no field, value is passed", ->
  #     index = @gr.get_reference_point()
  #     expect(index).to.be.equal 0
  #
  #   it "should return 0 if field not in column data source", ->
  #     index = @gr.get_reference_point('milk', 'bar')
  #     expect(index).to.be.equal 0
  #
  #   it "should return correct index if field and value in column data source", ->
  #     index = @gr.get_reference_point('label', 'bar')
  #     expect(index).to.be.equal 1
  #
  #   it "should return 0 index if field in column data source but value not available", ->
  #     index = @gr.get_reference_point('label', 'baz')
  #     expect(index).to.be.equal 0
  #
  #   it "should return 0 if data_source doesn't have get_column method", ->
  #     source = new DataSource()
  #     gr = new GlyphRenderer({'data_source': source})
  #     index = gr.get_reference_point('label', 20)
  #     expect(index).to.be.equal 0
  #
  # describe "hit_test_helper", ->
  #
  #   it "should return null if @visible is false", ->
  #     @gr.visible = false
  #     expect(@gr.hit_test_helper("junk", "junk")).to.be.equal null
