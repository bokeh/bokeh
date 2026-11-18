import {expect} from "#framework/assertions"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"
import {RecordDataSource} from "@bokehjs/models/sources/record_data_source"

describe("GraphDataSource", () => {
  it("provides canonical topology fields by default", () => {
    const source = GraphDataSource.create()

    expect(source.node_ids).to.be.equal([])
    expect(source.edge_starts).to.be.equal([])
    expect(source.edge_ends).to.be.equal([])
  })

  it("provides canonical topology fields for explicit empty data", () => {
    for (const empty of [[], {}]) {
      const source = GraphDataSource.create({nodes: empty, edges: empty})

      expect(source.node_ids).to.be.equal([])
      expect(source.edge_starts).to.be.equal([])
      expect(source.edge_ends).to.be.equal([])
      expect(source.nodes.fields()).to.be.equal(["index"])
      expect(source.edges.fields()).to.be.equal(["start", "end"])
    }
  })

  it("couples storage-neutral node and edge sources", () => {
    const node_source = RecordDataSource.create({records: [{index: "a"}, {index: "b"}]})
    const edge_source = RecordDataSource.create({records: [{start: "a", end: "b"}]})
    const source = GraphDataSource.create({nodes: node_source, edges: edge_source})

    expect(source.nodes).to.be.equal(node_source)
    expect(source.edges).to.be.equal(edge_source)
    expect(source.node_ids).to.be.equal(["a", "b"])
    expect(source.edge_starts).to.be.equal(["a"])
    expect(source.edge_ends).to.be.equal(["b"])
  })

  it("normalizes graph-shaped records", () => {
    const source = GraphDataSource.create({
      nodes: [{id: "a", color: "red"}, {id: "b", color: "blue"}],
      edges: [{source: "a", target: "b", weight: 2}],
    })

    expect(source.node_ids).to.be.equal(["a", "b"])
    expect(source.nodes.get("color")).to.be.equal(["red", "blue"])
    expect(source.edge_starts).to.be.equal(["a"])
    expect(source.edge_ends).to.be.equal(["b"])
    expect(source.edges.get("weight")).to.be.equal([2])
  })

  it("normalizes tuple edges and bare node identifiers", () => {
    const source = GraphDataSource.create({nodes: ["a", "b"], edges: [["a", "b", {weight: 2}]]})

    expect(source.node_ids).to.be.equal(["a", "b"])
    expect(source.edge_starts).to.be.equal(["a"])
    expect(source.edge_ends).to.be.equal(["b"])
    expect(source.edges.get("weight")).to.be.equal([2])
  })

  it("normalizes node mappings and node tuples", () => {
    const mapping = GraphDataSource.create({nodes: {a: {color: "red"}, b: {color: "blue"}}})
    expect(mapping.node_ids).to.be.equal(["a", "b"])
    expect(mapping.nodes.get("color")).to.be.equal(["red", "blue"])

    const tuples = GraphDataSource.create({nodes: [["a", {color: "red"}], ["b", {color: "blue"}]]})
    expect(tuples.node_ids).to.be.equal(["a", "b"])
    expect(tuples.nodes.get("color")).to.be.equal(["red", "blue"])
  })

  it("accepts a node mapping keyed by constructor", () => {
    const source = GraphDataSource.create({nodes: {constructor: {color: "red"}}})

    expect(source.node_ids).to.be.equal(["constructor"])
    expect(source.nodes.get("color")).to.be.equal(["red"])
  })

  it("rejects a node mapping attribute that would overwrite the node identifier", () => {
    expect(() => GraphDataSource.create({nodes: {a: {index: "b"}}})).to.throw(Error, "reserved 'index'")
  })

  it("preserves null topology values explicitly provided in records", () => {
    const source = GraphDataSource.create({
      nodes: [{id: null}, {id: "a"}],
      edges: [{source: null, target: "a"}],
    })
    expect(source.node_ids).to.be.equal([null, "a"])
    expect(source.edge_starts).to.be.equal([null])
  })

  it("ignores undefined optional aliases in graph records", () => {
    const source = GraphDataSource.create({
      nodes: [{id: undefined, index: 0}, {id: 1, index: undefined}],
      edges: [{source: undefined, start: 0, target: 1, end: undefined}],
    })
    expect(source.node_ids).to.be.equal([0, 1])
    expect(source.edge_starts).to.be.equal([0])
    expect(source.edge_ends).to.be.equal([1])
  })

  it("only uses own alias names when converting columns", () => {
    const source = GraphDataSource.create({nodes: {index: ["a"], toString: ["label"]}})
    expect(source.nodes.get("toString")).to.be.equal(["label"])
  })

  const metadata_cases: [string, GraphDataSource.Init][] = [
    ["columns", {nodes: {index: ["A", "B"], id: ["station-1", "station-2"]}, edges: {start: ["A"], end: ["B"], source: ["survey"]}}],
    ["records", {nodes: [{index: "A", id: "station-1"}, {index: "B", id: "station-2"}], edges: [{start: "A", end: "B", source: "survey"}]}],
  ]
  for (const [format, attrs] of metadata_cases) {
    it(`preserves alias-named metadata alongside canonical topology in ${format}`, () => {
      const source = GraphDataSource.create(attrs)
      expect(source.node_ids).to.be.equal(["A", "B"])
      expect(source.edge_starts).to.be.equal(["A"])
      expect(source.edge_ends).to.be.equal(["B"])
      expect(source.nodes.get("id")).to.be.equal(["station-1", "station-2"])
      expect(source.edges.get("source")).to.be.equal(["survey"])
    })
  }

  it("compares composite node identifiers structurally", () => {
    const source = GraphDataSource.create({
      nodes: [[1, 2], [3, 4]],
      edges: [[[1, 2], [3, 4]]],
    })

    expect(source.node_index([1, 2])).to.be.equal(0)
    expect(source.node_index([3, 4])).to.be.equal(1)
  })

  it("uses the first record for duplicate identifiers in an existing indexed source", () => {
    const nodes = ColumnDataSource.create({data: {index: [0, 0, 1]}})
    const source = GraphDataSource.create({nodes})
    expect(source.node_index(0)).to.be.equal(0)
    expect(source.node_index(1)).to.be.equal(2)
  })

  it("rejects duplicate node identifiers", () => {
    expect(() => GraphDataSource.create({nodes: [[1, 2], [1, 2]]})).to.throw(
      Error,
      "duplicate graph node identifier",
    )
  })

  it("normalizes missing scalar and nested attributes without undefined values", () => {
    const source = GraphDataSource.create({
      nodes: [{id: "a", label: "A", tags: ["one"]}, {id: "b"}],
    })

    expect(source.nodes.get("label")).to.be.equal(["A", null])
    expect(source.nodes.get("tags")).to.be.equal([["one"], []])
  })

  it("rejects mixed scalar and nested graph attributes", () => {
    expect(() => GraphDataSource.create({
      nodes: [{id: "a", value: [1]}, {id: "b", value: 2}],
    })).to.throw(Error, "can't mix scalar and non-scalar values for graph attributes")
  })

  it("rebuilds the node index when the node records change", () => {
    const nodes = ColumnDataSource.create({data: {index: ["a", "b"]}})
    const source = GraphDataSource.create({nodes})
    expect(source.node_index("a")).to.be.equal(0)

    nodes.data = {index: ["b", "a"]}
    expect(source.node_index("a")).to.be.equal(1)
    expect(source.node_index("b")).to.be.equal(0)
  })
})
