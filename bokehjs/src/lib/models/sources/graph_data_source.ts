import type * as p from "core/properties"
import {construct} from "core/has_props"
import type {HasProps, HasPropsClass, ModelAttrs} from "core/has_props"
import type {Arrayable, Attrs, Data} from "core/types"
import {isArray, isPlainObject} from "core/util/types"
import {GraphSelectionManager} from "core/selection_manager"
import {ColumnDataSource} from "./column_data_source"
import {DataSource} from "./data_source"
import {IndexedDataSource} from "./indexed_data_source"
import {GraphSelectionPolicy} from "../selections/interaction_policy"
import type {GraphTraversalDirection} from "../selections/interaction_policy"

export namespace GraphDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type NodeRecord = {id?: unknown, index?: unknown, [key: string]: unknown}
  export type EdgeRecord = {source?: unknown, target?: unknown, start?: unknown, end?: unknown, [key: string]: unknown}
  export type Columns = {[key: string]: Arrayable | undefined}
  export type Nodes = IndexedDataSource | Columns | unknown[]
  export type Edges = IndexedDataSource | Columns | (EdgeRecord | [unknown, unknown] | [unknown, unknown, {[key: string]: unknown}])[]
  export type Init = Omit<Partial<Attrs>, "nodes" | "edges"> & {nodes?: Nodes, edges?: Edges}

  export type Props = DataSource.Props & {
    nodes: p.Property<IndexedDataSource>
    edges: p.Property<IndexedDataSource>
    selection_policy: p.Property<GraphSelectionPolicy>
  }
}

export interface GraphDataSource extends GraphDataSource.Attrs {}

function rows_source(records: object[]): ColumnDataSource {
  const fields = new Set(records.flatMap((record) => Object.keys(record)))
  const data: Data = {}
  for (const field of fields) {
    const values = records.map((record) => (record as {[key: string]: unknown})[field])
    const nested = values.some((value) => isArray(value))
    if (nested && values.some((value) => value != null && !isArray(value))) {
      throw new Error("can't mix scalar and non-scalar values for graph attributes")
    }
    data[field] = nested
      ? values.map((value) => value == null ? [] : value) as unknown[][]
      : values.map((value) => value ?? null)
  }
  return ColumnDataSource.create({data})
}

function columns_source(columns: GraphDataSource.Columns, aliases: {[key: string]: string}): ColumnDataSource {
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (alias in columns && canonical in columns) {
      throw new Error(`graph data cannot contain both '${alias}' and '${canonical}' fields`)
    }
  }

  const data: Data = {}
  for (const [field, values] of Object.entries(columns)) {
    if (values == null) {
      throw new Error(`graph field '${field}' has an invalid value`)
    }
    const canonical = aliases[field] ?? field
    data[canonical] = values
  }
  return ColumnDataSource.create({data})
}

function node_source(nodes: GraphDataSource.Nodes): IndexedDataSource {
  if (nodes instanceof IndexedDataSource) {
    return nodes
  }
  if (!isArray(nodes)) {
    if (Object.keys(nodes).length == 0) {
      return ColumnDataSource.create({data: {index: []}})
    }
    return columns_source(nodes, {id: "index"})
  }
  if (nodes.length == 0) {
    return ColumnDataSource.create({data: {index: []}})
  }

  const records = nodes.map((node) => {
    if (isPlainObject(node)) {
      const {id, index, ...attrs} = node
      if (id != null && index != null) {
        throw new Error("a node record cannot contain both 'id' and 'index'")
      }
      if (id == null && index == null) {
        throw new Error("a node record must contain an 'id' or 'index' field")
      }
      return {index: index ?? id, ...attrs}
    }
    return {index: node}
  })
  return rows_source(records)
}

function edge_source(edges: GraphDataSource.Edges): IndexedDataSource {
  if (edges instanceof IndexedDataSource) {
    return edges
  }
  if (!isArray(edges)) {
    if (Object.keys(edges).length == 0) {
      return ColumnDataSource.create({data: {start: [], end: []}})
    }
    return columns_source(edges, {source: "start", target: "end"})
  }
  if (edges.length == 0) {
    return ColumnDataSource.create({data: {start: [], end: []}})
  }

  const records = edges.map((edge) => {
    if (isArray(edge)) {
      if (edge.length < 2 || edge.length > 3) {
        throw new Error("an edge tuple must contain source, target, and optional attributes")
      }
      const [start, end, attrs = {}] = edge
      if (!isPlainObject(attrs)) {
        throw new Error("edge tuple attributes must be an object")
      }
      if (["source", "target", "start", "end"].some((field) => field in attrs)) {
        throw new Error("edge tuple attributes cannot contain endpoint fields")
      }
      return {start, end, ...attrs}
    }
    const {source, target, start, end, ...attrs} = edge
    if ((source != null && start != null) || (target != null && end != null)) {
      throw new Error("an edge record cannot contain both endpoint aliases")
    }
    if ((source ?? start) == null || (target ?? end) == null) {
      throw new Error("an edge record must contain source/target or start/end fields")
    }
    return {start: start ?? source, end: end ?? target, ...attrs}
  })
  return rows_source(records)
}

/** A coupled pair of indexed sources containing graph nodes and edges. */
export class GraphDataSource extends DataSource {
  declare properties: GraphDataSource.Props

  readonly selection_manager = new GraphSelectionManager(this)

  static override create<T extends GraphDataSource>(
    this: HasPropsClass<T>, attrs?: GraphDataSource.Init,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs?: ModelAttrs<T>,
  ): T
  static override create<T extends HasProps>(
    this: HasPropsClass<T>, attrs: GraphDataSource.Init | ModelAttrs<T> = {},
  ): T {
    return construct(this, attrs as Attrs)
  }

  private _node_index?: Map<unknown, number>
  private _out_neighbors?: Map<unknown, unknown[]>
  private _in_neighbors?: Map<unknown, unknown[]>
  private _incident_edges?: Map<unknown, number[]>

  protected constructor(attrs: GraphDataSource.Init = {}) {
    const {nodes: raw_nodes, edges: raw_edges, ...rest} = attrs
    const nodes = node_source(raw_nodes ?? [])
    const edges = edge_source(raw_edges ?? [])
    super({...rest, nodes, edges} as Partial<GraphDataSource.Attrs> as Partial<DataSource.Attrs>)
  }

  static {
    this.define<GraphDataSource.Props>(({Ref}) => ({
      nodes: [ Ref(IndexedDataSource), () => ColumnDataSource.create({data: {index: []}}), {readonly: true} ],
      edges: [ Ref(IndexedDataSource), () => ColumnDataSource.create({data: {start: [], end: []}}), {readonly: true} ],
      selection_policy: [ Ref(GraphSelectionPolicy), () => GraphSelectionPolicy.create() ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.nodes.change, () => {
      this._node_index = undefined
      this.data_changed.emit({path: ["nodes"], structural: true})
    })
    this.connect(this.edges.change, () => {
      this._out_neighbors = undefined
      this._in_neighbors = undefined
      this._incident_edges = undefined
      this.data_changed.emit({path: ["edges"], structural: true})
    })
    this.connect(this.nodes.data_changed, (change) => {
      this._node_index = undefined
      this.data_changed.emit({...change, path: ["nodes", ...(change.path ?? [])]})
    })
    this.connect(this.edges.data_changed, (change) => {
      this._out_neighbors = undefined
      this._in_neighbors = undefined
      this._incident_edges = undefined
      this.data_changed.emit({...change, path: ["edges", ...(change.path ?? [])]})
    })
  }

  get node_ids(): Arrayable {
    return this.nodes.get_field("index") ?? []
  }

  get edge_starts(): Arrayable {
    return this.edges.get_field("start") ?? []
  }

  get edge_ends(): Arrayable {
    return this.edges.get_field("end") ?? []
  }

  node_index(id: unknown): number | undefined {
    if (this._node_index == null) {
      this._node_index = new Map()
      for (let i = 0; i < this.node_ids.length; i++) {
        if (!this._node_index.has(this.node_ids[i])) {
          this._node_index.set(this.node_ids[i], i)
        }
      }
    }
    return this._node_index.get(id)
  }

  private _build_topology(): void {
    if (this._out_neighbors != null) {
      return
    }
    this._out_neighbors = new Map()
    this._in_neighbors = new Map()
    this._incident_edges = new Map()
    const append = <T>(mapping: Map<unknown, T[]>, key: unknown, value: T) => {
      const values = mapping.get(key) ?? []
      values.push(value)
      mapping.set(key, values)
    }
    for (let i = 0; i < this.edge_starts.length; i++) {
      const start = this.edge_starts[i]
      const end = this.edge_ends[i]
      append(this._out_neighbors, start, end)
      append(this._in_neighbors, end, start)
      append(this._incident_edges, start, i)
      if (end !== start) {
        append(this._incident_edges, end, i)
      }
    }
  }

  neighbors(id: unknown, direction: GraphTraversalDirection): unknown[] {
    this._build_topology()
    if (direction == "out") {
      return this._out_neighbors!.get(id) ?? []
    } else if (direction == "in") {
      return this._in_neighbors!.get(id) ?? []
    } else {
      return [...(this._out_neighbors!.get(id) ?? []), ...(this._in_neighbors!.get(id) ?? [])]
    }
  }

  incident_edge_indices(node_ids: Iterable<unknown>): number[] {
    this._build_topology()
    const indices = new Set<number>()
    for (const id of node_ids) {
      for (const index of this._incident_edges!.get(id) ?? []) {
        indices.add(index)
      }
    }
    return [...indices]
  }
}
