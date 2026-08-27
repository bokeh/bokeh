import {expect} from "#framework/assertions"

import {CircularLayoutProvider} from "@bokehjs/models/graphs/circular_layout_provider"
import {ForceDirectedLayoutProvider} from "@bokehjs/models/graphs/force_directed_layout_provider"
import {GridLayoutProvider} from "@bokehjs/models/graphs/grid_layout_provider"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

describe("algorithmic layout providers", () => {
  const source = GraphDataSource.create({
    nodes: ["a", "b", "c", "d"],
    edges: [["a", "b"], ["b", "c"], ["c", "d"]],
  })

  it("should place nodes on a circle", () => {
    const provider = CircularLayoutProvider.create({center: [1, 2], radius: 2})
    const [xs, ys] = provider.get_node_coordinates(source)

    expect(xs[0]).to.be.equal(3)
    expect(ys[0]).to.be.equal(2)
    expect(Math.abs(xs[1] - 1) < 1e-12).to.be.true
    expect(ys[1]).to.be.equal(4)
    expect(xs[2]).to.be.equal(-1)
    expect(Math.abs(ys[2] - 2) < 1e-12).to.be.true
  })

  it("should place nodes on a centered grid", () => {
    const provider = GridLayoutProvider.create({columns: 2, spacing: 2})
    const [xs, ys] = provider.get_node_coordinates(source)

    expect(xs).to.be.equal(new Float64Array([-1, 1, -1, 1]))
    expect(ys).to.be.equal(new Float64Array([1, 1, -1, -1]))
  })

  it("should compute deterministic bounded force layouts", () => {
    const first = ForceDirectedLayoutProvider.create({seed: 17, iterations: 40})
    const second = ForceDirectedLayoutProvider.create({seed: 17, iterations: 40})
    const [xs0, ys0] = first.get_node_coordinates(source)
    const [xs1, ys1] = second.get_node_coordinates(source)

    expect(xs0).to.be.equal(xs1)
    expect(ys0).to.be.equal(ys1)
    expect([...xs0, ...ys0].every((value) => Number.isFinite(value) && Math.abs(value) <= 1 + 1e-12)).to.be.true
  })

  it("should invalidate computed layouts", () => {
    const provider = CircularLayoutProvider.create()
    const [xs0] = provider.get_node_coordinates(source)
    provider.radius = 2
    provider.invalidate(source)
    const [xs1] = provider.get_node_coordinates(source)

    expect(xs0[0]).to.be.equal(1)
    expect(xs1[0]).to.be.equal(2)
  })
})
