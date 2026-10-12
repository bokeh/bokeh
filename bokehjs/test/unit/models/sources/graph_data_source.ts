import {expect} from "#framework/assertions"

import type * as p from "@bokehjs/core/properties"
import type {Arrayable, Dict} from "@bokehjs/core/types"
import type {Index} from "@bokehjs/core/util/templating"
import {dict, keys, to_object} from "@bokehjs/core/util/object"
import {isNumber} from "@bokehjs/core/util/types"
import {IndexedDataSource} from "@bokehjs/models/sources/indexed_data_source"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GraphDataSource} from "@bokehjs/models/sources/graph_data_source"

namespace RecordDataSource {
  export type Attrs = p.AttrsOf<Props>
  export type Props = IndexedDataSource.Props & {
    records: p.Property<Dict<unknown>[]>
  }
}

interface RecordDataSource extends RecordDataSource.Attrs {}

class RecordDataSource extends IndexedDataSource {
  declare properties: RecordDataSource.Props

  static {
    this.define<RecordDataSource.Props>(({List, Dict, Unknown}) => ({
      records: [ List(Dict(Unknown)), [] ],
    }))
  }

  get_length(): number {
    return this.records.length
  }

  get_field(name: string): Arrayable | null {
    return this.fields().includes(name) ? this.records.map((record) => dict(record).get(name)) : null
  }

  get_record(index: Index): {[key: string]: unknown} {
    const i = isNumber(index) ? index : index.index
    return to_object(this.records[i])
  }

  fields(): string[] {
    return [...new Set(this.records.flatMap((record) => keys(record)))]
  }
}

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

  it("compares composite node identifiers structurally", () => {
    const source = GraphDataSource.create({
      nodes: [[1, 2], [3, 4]],
      edges: [[[1, 2], [3, 4]]],
    })

    expect(source.node_index([1, 2])).to.be.equal(0)
    expect(source.node_index([3, 4])).to.be.equal(1)
    expect(source.neighbors([1, 2], "out")).to.be.equal([[3, 4]])
    expect(source.incident_edge_indices([[3, 4]])).to.be.equal([0])
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

  it("invalidates cached topology when edge data changes", () => {
    const source = GraphDataSource.create({nodes: [0, 1, 2], edges: [[0, 1]]})
    expect(source.neighbors(0, "out")).to.be.equal([1])

    expect(source.edges).to.be.instanceof(ColumnDataSource)
    const edges = source.edges as ColumnDataSource
    edges.data = {start: [0], end: [2]}

    expect(source.neighbors(0, "out")).to.be.equal([2])
  })
})
