import {expect} from "#framework/assertions"

import {ArcEdgePathProvider} from "@bokehjs/models/graphs/arc_edge_path_provider"
import {BezierEdgePathProvider} from "@bokehjs/models/graphs/bezier_edge_path_provider"
import {OrthogonalEdgePathProvider} from "@bokehjs/models/graphs/orthogonal_edge_path_provider"
import {StaticLayoutProvider} from "@bokehjs/models/graphs/static_layout_provider"
import {StraightEdgePathProvider} from "@bokehjs/models/graphs/straight_edge_path_provider"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

describe("EdgePathProvider", () => {
  const layout = StaticLayoutProvider.create({
    graph_layout: new Map([
      ["a", [0, 0]],
      ["b", [2, 0]],
      ["c", [2, 2]],
    ]),
  })

  it("should derive straight paths", () => {
    const source = GraphDataSource.create({nodes: ["a", "b"], edges: [["a", "b"]]})
    const [xs, ys] = StraightEdgePathProvider.create().get_edge_coordinates(source, layout)

    expect(xs).to.be.equal([[0, 2]])
    expect(ys).to.be.equal([[0, 0]])
  })

  it("should resolve composite identifiers in static layouts and edges", () => {
    const source = GraphDataSource.create({
      nodes: [[1, 2], [3, 4]],
      edges: [[[1, 2], [3, 4]]],
    })
    const composite_layout = StaticLayoutProvider.create({
      graph_layout: new Map([
        [[1, 2], [0, 0]],
        [[3, 4], [2, 0]],
      ]),
    })
    const [xs, ys] = StraightEdgePathProvider.create().get_edge_coordinates(source, composite_layout)

    expect(xs).to.be.equal([[0, 2]])
    expect(ys).to.be.equal([[0, 0]])
  })

  it("should sample quadratic Bezier paths", () => {
    const source = GraphDataSource.create({nodes: ["a", "b"], edges: [["a", "b"]]})
    const provider = BezierEdgePathProvider.create({curvature: 0.25, parallel_spacing: 0, steps: 2})
    const [xs, ys] = provider.get_edge_coordinates(source, layout)

    expect(xs[0]).to.be.equal(new Float64Array([0, 1, 2]))
    expect(ys[0]).to.be.equal(new Float64Array([0, 0.5, 0]))
  })

  it("should read per-edge curvature fields", () => {
    const source = GraphDataSource.create({
      nodes: ["a", "b"],
      edges: [
        {source: "a", target: "b", curvature: 0.25},
        {source: "a", target: "b", curvature: -0.25},
      ],
    })
    const provider = BezierEdgePathProvider.create({curvature: {field: "curvature"}, parallel_spacing: 0, steps: 2})
    const [, ys] = provider.get_edge_coordinates(source, layout)

    expect(ys[0][1]).to.be.equal(0.5)
    expect(ys[1][1]).to.be.equal(-0.5)
  })

  it("should separate parallel Bezier paths", () => {
    const source = GraphDataSource.create({nodes: ["a", "b"], edges: [["a", "b"], ["a", "b"]]})
    const provider = BezierEdgePathProvider.create({curvature: 0, parallel_spacing: 0.2, steps: 2})
    const [, ys] = provider.get_edge_coordinates(source, layout)

    expect(ys[0][1]).to.be.equal(-0.2)
    expect(ys[1][1]).to.be.equal(0.2)
  })

  it("should sample circular arcs", () => {
    const source = GraphDataSource.create({nodes: ["a", "b"], edges: [["a", "b"]]})
    const provider = ArcEdgePathProvider.create({curvature: 0.25, parallel_spacing: 0, steps: 2})
    const [xs, ys] = provider.get_edge_coordinates(source, layout)

    expect(Math.abs(xs[0][0]) < 1e-12).to.be.true
    expect(Math.abs(xs[0][1] - 1) < 1e-12).to.be.true
    expect(Math.abs(xs[0][2] - 2) < 1e-12).to.be.true
    expect(Math.abs(ys[0][1] - 0.5) < 1e-12).to.be.true
  })

  it("should derive orthogonal paths", () => {
    const source = GraphDataSource.create({nodes: ["a", "c"], edges: [["a", "c"]]})
    const provider = OrthogonalEdgePathProvider.create()
    const [xs, ys] = provider.get_edge_coordinates(source, layout)

    expect(xs[0]).to.be.equal([0, 1, 1, 2])
    expect(ys[0]).to.be.equal([0, 0, 2, 2])
  })

  it("should round orthogonal corners", () => {
    const source = GraphDataSource.create({nodes: ["a", "c"], edges: [["a", "c"]]})
    const provider = OrthogonalEdgePathProvider.create({corner_radius: 0.2, steps: 3})
    const [xs, ys] = provider.get_edge_coordinates(source, layout)

    expect(xs[0].length).to.be.equal(10)
    expect(xs[0][0]).to.be.equal(0)
    expect(ys[0][0]).to.be.equal(0)
    expect(xs[0][xs[0].length - 1]).to.be.equal(2)
    expect(ys[0][ys[0].length - 1]).to.be.equal(2)
  })

  it("should render self-loops", () => {
    const source = GraphDataSource.create({nodes: ["a"], edges: [["a", "a"]]})
    const provider = BezierEdgePathProvider.create({loop_radius: 0.5, steps: 4})
    const [xs, ys] = provider.get_edge_coordinates(source, layout)

    expect(xs[0][0]).to.be.similar(0)
    expect(xs[0][1]).to.be.similar(0.5)
    expect(xs[0][2]).to.be.similar(0)
    expect(xs[0][3]).to.be.similar(-0.5)
    expect(xs[0][4]).to.be.similar(0)
    expect(ys[0][0]).to.be.similar(0)
    expect(ys[0][1]).to.be.similar(0.5)
    expect(ys[0][2]).to.be.similar(1)
    expect(ys[0][3]).to.be.similar(0.5)
    expect(ys[0][4]).to.be.similar(0)
  })

  it("should separate multiple self-loops", () => {
    const source = GraphDataSource.create({nodes: ["a"], edges: [["a", "a"], ["a", "a"]]})
    const provider = StraightEdgePathProvider.create({loop_radius: 0.5, loop_spacing: 1, steps: 4})
    const [xs] = provider.get_edge_coordinates(source, layout)

    expect(xs[0][1]).to.be.similar(0.5)
    expect(xs[1][1]).to.be.similar(1)
  })

  it("should give explicit paths precedence over generated paths", () => {
    const source = GraphDataSource.create({
      nodes: ["a"],
      edges: {start: ["a"], end: ["missing"], xs: [[0, 1, 3]], ys: [[0, 2, 0]]},
    })
    const [xs, ys] = BezierEdgePathProvider.create().get_edge_coordinates(source, layout)

    expect(xs).to.be.equal([[0, 1, 3]])
    expect(ys).to.be.equal([[0, 2, 0]])
  })
})
