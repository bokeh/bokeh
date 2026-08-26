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
    data[field] = records.map((record) => (record as {[key: string]: unknown})[field])
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
    this.connect(this.nodes.data_changed, (change) => {
      this.data_changed.emit({...change, path: ["nodes", ...(change.path ?? [])]})
    })
    this.connect(this.edges.data_changed, (change) => {
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
}
