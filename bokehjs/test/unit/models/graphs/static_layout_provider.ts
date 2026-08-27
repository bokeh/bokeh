import {expect} from "#framework/assertions"

import {StaticLayoutProvider} from "@bokehjs/models/graphs/static_layout_provider"
import {StraightEdgePathProvider} from "@bokehjs/models/graphs/straight_edge_path_provider"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

describe("StaticLayoutProvider", () => {

  describe("default props", () => {
    it("should create an empty dict", () => {
      const layout_provider = StaticLayoutProvider.create()
      expect(layout_provider.graph_layout).to.be.equal(new Map())
    })
  })

  describe("graph component layout methods", () => {
    let layout_provider: StaticLayoutProvider

    before_each(() => {
      layout_provider = StaticLayoutProvider.create({
        graph_layout: new Map([[0, [-1, 0]], [1, [0, 1]], [2, [1, 0]], [3, [0, -1]]]),
      })
    })

    it("should return node coordinates", () => {
      const source = GraphDataSource.create({nodes: [0, 1, 2, 3]})
      const [xs, ys] = layout_provider.get_node_coordinates(source)
      expect(xs).to.be.equal(new Float64Array([-1, 0, 1, 0]))
      expect(ys).to.be.equal(new Float64Array([0, 1, 0, -1]))
    })

    it("should return NaNs for missing node coordinates", () => {
      const source = GraphDataSource.create({nodes: [4, 5, 6]})
      const [xs, ys] = layout_provider.get_node_coordinates(source)
      expect(xs).to.be.equal(new Float64Array([NaN, NaN, NaN]))
      expect(ys).to.be.equal(new Float64Array([NaN, NaN, NaN]))
    })

    it("should derive straight edge coordinates", () => {
      const source = GraphDataSource.create({nodes: [0, 1, 2, 3], edges: [[0, 1], [0, 2], [0, 3]]})
      const [xs, ys] = StraightEdgePathProvider.create().get_edge_coordinates(source, layout_provider)
      expect(xs).to.be.equal([[-1, 0], [-1, 1], [-1, 0]])
      expect(ys).to.be.equal([[0, 1], [0, 0], [0, -1]])
    })

    it("should preserve explicit edge paths", () => {
      const source = GraphDataSource.create({
        nodes: [0, 1, 2, 3],
        edges: {
          start: [0, 0, 0],
          end: [1, 2, 3],
          xs: [[-1, -0.5, 0], [-1, 0, 1], [-1, -0.5, 0]],
          ys: [[0, 0.5, 1], [0, 0, 0], [0, -0.5, -1]],
        },
      })
      const [xs, ys] = StraightEdgePathProvider.create().get_edge_coordinates(source, layout_provider)
      expect(xs).to.be.equal([[-1, -0.5, 0], [-1, 0, 1], [-1, -0.5, 0]])
      expect(ys).to.be.equal([[0, 0.5, 1], [0, 0, 0], [0, -0.5, -1]])
    })

    it("should return NaN edge coordinates when endpoints are missing", () => {
      const source = GraphDataSource.create({nodes: [4, 5, 6, 7], edges: [[4, 5], [4, 6], [4, 7]]})
      const [xs, ys] = StraightEdgePathProvider.create().get_edge_coordinates(source, layout_provider)
      expect(xs).to.be.equal([[NaN, NaN], [NaN, NaN], [NaN, NaN]])
      expect(ys).to.be.equal([[NaN, NaN], [NaN, NaN], [NaN, NaN]])
    })
  })
})
