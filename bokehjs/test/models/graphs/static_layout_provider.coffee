{expect} = require "chai"
utils = require "../../utils"

{StaticLayoutProvider} = utils.require("models/graphs/static_layout_provider")
{GraphDataSource} = utils.require("models/graphs/graph_data_source")

describe "StaticLayoutProvider", ->

  describe "default props", ->

    it "should create an empty dict", ->
      layout_provider = new StaticLayoutProvider()
      expect(layout_provider.graph_layout).to.be.deep.equal({})

  describe "graph component layout methods", ->

    before ->
      graph_layout = {0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1]}
      @layout_provider = new StaticLayoutProvider({graph_layout: graph_layout})

    describe "get_node_coordinates method", ->

      it "should return node coords if exist", ->
        graph_source = new GraphDataSource()
        graph_source.nodes.data.index = [0,1,2,3]

        [xs, ys] = @layout_provider.get_node_coordinates(graph_source)
        expect(xs).to.be.deep.equal([-1,0,1,0])
        expect(ys).to.be.deep.equal([0,1,0,-1])

      it "should return nulls if coords don't exist", ->
        graph_source = new GraphDataSource()
        graph_source.nodes.data.index = [4,5,6]

        [xs, ys] = @layout_provider.get_node_coordinates(graph_source)
        expect(xs).to.be.deep.equal([null, null, null])
        expect(ys).to.be.deep.equal([null, null, null])

    describe "get_node_coordinates method", ->

      it "should return edge coords if exist", ->
        graph_source = new GraphDataSource()
        graph_source.nodes.data.index = [0,1,2,3]
        graph_source.edges.data.start = [0,0,0]
        graph_source.edges.data.end = [1,2,3]

        [xs, ys] = @layout_provider.get_edge_coordinates(graph_source)
        expect(xs).to.be.deep.equal([ [ -1, 0 ], [ -1, 1 ], [ -1, 0 ] ])
        expect(ys).to.be.deep.equal([ [ 0, 1 ], [ 0, 0 ], [ 0, -1 ] ])

      it "should return nulls if coords don't exist", ->
        graph_source = new GraphDataSource()
        graph_source.nodes.data.index = [4,5,6,7]
        graph_source.edges.data.start = [4,4,4]
        graph_source.edges.data.end = [5,6,7]

        [xs, ys] = @layout_provider.get_edge_coordinates(graph_source)
        expect(xs).to.be.deep.equal([ [ null, null ], [ null, null ], [ null, null ] ])
        expect(ys).to.be.deep.equal([ [ null, null ], [ null, null ], [ null, null ] ])
