import {expect, expect_not_null} from "#framework/assertions"

import {GraphSelectionPolicy} from "@bokehjs/models/selections/interaction_policy"
import {Selection} from "@bokehjs/models/selections/selection"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

describe("GraphSelectionPolicy", () => {
  const source = GraphDataSource.create({
    nodes: [0, 1, 2, 3, 4],
    edges: [[0, 1], [1, 2], [0, 3], [3, 4]],
  })

  it("keeps direct node hits by default", () => {
    const policy = GraphSelectionPolicy.create()
    const {nodes, edges} = policy.expand(source, "nodes", Selection.create({indices: [0]}))

    expect_not_null(nodes)
    expect(nodes.indices).to.be.equal([0])
    expect(edges.is_empty()).to.be.true
  })

  it("selects nodes up to N hops away", () => {
    const policy = GraphSelectionPolicy.create({node_hops: 2})
    const {nodes} = policy.expand(source, "nodes", Selection.create({indices: [0]}))

    expect_not_null(nodes)
    expect(nodes.indices).to.be.equal([0, 1, 3, 2, 4])
  })

  it("selects only the exact N-hop frontier", () => {
    const policy = GraphSelectionPolicy.create({node_hops: 2, node_hops_mode: "exact", include_direct: false})
    const {nodes} = policy.expand(source, "nodes", Selection.create({indices: [0]}))

    expect_not_null(nodes)
    expect(nodes.indices).to.be.equal([2, 4])
  })

  it("respects edge direction during traversal", () => {
    const policy = GraphSelectionPolicy.create({node_hops: 2, node_direction: "in"})
    const {nodes} = policy.expand(source, "nodes", Selection.create({indices: [2]}))

    expect_not_null(nodes)
    expect(nodes.indices).to.be.equal([2, 1, 0])
  })

  it("expands selected nodes to incident edges", () => {
    const policy = GraphSelectionPolicy.create({node_hops: 1, include_incident_edges: true})
    const {nodes, edges} = policy.expand(source, "nodes", Selection.create({indices: [0]}))

    expect_not_null(nodes)
    expect_not_null(edges)
    expect(nodes.indices).to.be.equal([0, 1, 3])
    expect(edges.indices).to.be.equal([0, 1, 2, 3])
  })

  it("expands selected edges to endpoint nodes", () => {
    const policy = GraphSelectionPolicy.create({include_end_nodes: true})
    const {nodes, edges} = policy.expand(source, "edges", Selection.create({indices: [1]}))

    expect_not_null(nodes)
    expect_not_null(edges)
    expect(nodes.indices).to.be.equal([1, 2])
    expect(edges.indices).to.be.equal([1])
  })
})
