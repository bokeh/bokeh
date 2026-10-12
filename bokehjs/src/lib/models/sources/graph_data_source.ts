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
  export type Nodes = IndexedDataSource | Columns | {[key: string]: {[key: string]: unknown}} | unknown[]
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
    if (field == "index" || field == "start" || field == "end") {
      data[field] = values
      continue
    }
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
    if (!("id" in nodes || "index" in nodes) && Object.values(nodes).every((attrs) => isPlainObject(attrs))) {
      return rows_source(Object.entries(nodes).map(([index, attrs]) => ({index, ...attrs})))
    }
    return columns_source(nodes as GraphDataSource.Columns, {id: "index"})
  }
  if (nodes.length == 0) {
    return ColumnDataSource.create({data: {index: []}})
  }

  const records = nodes.map((node) => {
    if (isArray(node) && node.length == 2 && isPlainObject(node[1])) {
      const [index, attrs] = node
      if ("index" in attrs) {
        throw new Error("node tuple attributes cannot contain the reserved 'index' field")
      }
      return {index, ...attrs}
    } else if (isPlainObject(node)) {
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
      if (["start", "end"].some((field) => field in attrs)) {
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

function graph_id_key(id: unknown): string {
  if (isArray(id)) {
    return `array:${JSON.stringify(id.map((item) => graph_id_key(item)))}`
  }
  switch (typeof id) {
    case "string":
      return `string:${JSON.stringify(id)}`
    case "number":
      return `number:${Object.is(id, -0) ? "-0" : String(id)}`
    case "boolean":
      return `boolean:${id}`
    case "bigint":
      return `bigint:${id}`
    case "undefined":
      return "undefined"
    case "object":
      if (id === null) {
        return "null"
      }
  }
  throw new Error("graph node identifiers must be scalar values or nested arrays of scalar values")
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

  private _node_index?: Map<string, number>
  private _out_neighbors?: Map<string, unknown[]>
  private _in_neighbors?: Map<string, unknown[]>
  private _incident_edges?: Map<string, number[]>

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

  override initialize(): void {
    super.initialize()
    this._ensure_node_index()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.nodes.change, () => {
      this._invalidate_nodes()
      this.data_changed.emit({path: ["nodes"], structural: true})
    })
    this.connect(this.edges.change, () => {
      this._out_neighbors = undefined
      this._in_neighbors = undefined
      this._incident_edges = undefined
      this.data_changed.emit({path: ["edges"], structural: true})
    })
    this.connect(this.nodes.data_changed, (change) => {
      this._invalidate_nodes()
      this.data_changed.emit({...change, path: ["nodes", ...(change.path ?? [])]})
    })
    this.connect(this.edges.data_changed, (change) => {
      this._out_neighbors = undefined
      this._in_neighbors = undefined
      this._incident_edges = undefined
      this.data_changed.emit({...change, path: ["edges", ...(change.path ?? [])]})
    })
  }

  private _invalidate_nodes(): void {
    this._node_index = undefined
    this._out_neighbors = undefined
    this._in_neighbors = undefined
    this._incident_edges = undefined
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
    this._ensure_node_index()
    return this._node_index!.get(graph_id_key(id))
  }

  node_key(id: unknown): string {
    return graph_id_key(id)
  }

  private _ensure_node_index(): void {
    if (this._node_index == null) {
      this._node_index = new Map()
      for (let i = 0; i < this.node_ids.length; i++) {
        const id = this.node_ids[i]
        const key = graph_id_key(id)
        if (this._node_index.has(key)) {
          throw new Error(`duplicate graph node identifier at index ${i}`)
        }
        this._node_index.set(key, i)
      }
    }
  }

  private _build_topology(): void {
    if (this._out_neighbors != null) {
      return
    }
    this._out_neighbors = new Map()
    this._in_neighbors = new Map()
    this._incident_edges = new Map()
    this._ensure_node_index()
    const append = <T>(mapping: Map<string, T[]>, key: string, value: T) => {
      const values = mapping.get(key) ?? []
      values.push(value)
      mapping.set(key, values)
    }
    for (let i = 0; i < this.edge_starts.length; i++) {
      const start = this.edge_starts[i]
      const end = this.edge_ends[i]
      const start_key = graph_id_key(start)
      const end_key = graph_id_key(end)
      const start_index = this._node_index!.get(start_key)
      const end_index = this._node_index!.get(end_key)
      if (start_index != null) {
        append(this._incident_edges, start_key, i)
      }
      if (end_index != null && end_key != start_key) {
        append(this._incident_edges, end_key, i)
      }
      if (start_index != null && end_index != null) {
        append(this._out_neighbors, start_key, this.node_ids[end_index])
        append(this._in_neighbors, end_key, this.node_ids[start_index])
      }
    }
  }

  neighbors(id: unknown, direction: GraphTraversalDirection): unknown[] {
    this._build_topology()
    const key = graph_id_key(id)
    if (direction == "out") {
      return this._out_neighbors!.get(key) ?? []
    } else if (direction == "in") {
      return this._in_neighbors!.get(key) ?? []
    } else {
      return [...(this._out_neighbors!.get(key) ?? []), ...(this._in_neighbors!.get(key) ?? [])]
    }
  }

  incident_edge_indices(node_ids: Iterable<unknown>): number[] {
    this._build_topology()
    const indices = new Set<number>()
    for (const id of node_ids) {
      for (const index of this._incident_edges!.get(graph_id_key(id)) ?? []) {
        indices.add(index)
      }
    }
    return [...indices]
  }
}
