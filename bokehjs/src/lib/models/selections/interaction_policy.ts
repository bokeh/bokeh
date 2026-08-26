import {Model} from "../../model"
import type * as p from "core/properties"
import type {Geometry} from "core/geometry"
import type {HitTestResult} from "core/hittest"
import type {SelectionMode} from "core/enums"
import {Enum, NonNegative} from "core/kinds"
import {uniq} from "core/util/array"
import {index_of, map} from "core/util/arrayable"
import type {GlyphRendererView} from "../renderers/glyph_renderer"
import type {GraphDataSource} from "../sources/graph_data_source"
import type {IndexedDataSource} from "../sources/indexed_data_source"
import {Selection} from "./selection"

export const RendererSelectionMode = Enum("union", "intersect")
export type RendererSelectionMode = typeof RendererSelectionMode["__type__"]

export namespace SelectionPolicy {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props & {
    mode: p.Property<RendererSelectionMode>
  }
}

export interface SelectionPolicy extends SelectionPolicy.Attrs {}

/** Controls how hit-test results from renderers sharing a source are merged. */
export class SelectionPolicy extends Model {
  declare properties: SelectionPolicy.Props

  static {
    this.define<SelectionPolicy.Props>(() => ({
      mode: [ RendererSelectionMode, "union" ],
    }))
  }

  hit_test(geometry: Geometry, renderer_views: GlyphRendererView[]): HitTestResult {
    const results = []
    for (const renderer of renderer_views) {
      const result = renderer.hit_test(geometry)
      if (result != null) {
        results.push(result)
      }
    }
    if (results.length == 0) {
      return null
    }

    const [result, ...rest] = results
    for (const other of rest) {
      if (this.mode == "union") {
        result.update_through_union(other)
      } else {
        result.update_through_intersection(other)
      }
    }
    return result
  }

  do_selection(hit_test_result: HitTestResult, source: IndexedDataSource, final: boolean, mode: SelectionMode): boolean {
    if (hit_test_result == null) {
      return false
    } else {
      source.selected.update(hit_test_result, final, mode)
      source._select.emit()
      return !source.selected.is_empty()
    }
  }
}

export const GraphSelectionTarget = Enum("nodes", "edges")
export type GraphSelectionTarget = typeof GraphSelectionTarget["__type__"]

export const GraphTraversalMode = Enum("exact", "up_to")
export type GraphTraversalMode = typeof GraphTraversalMode["__type__"]

export const GraphTraversalDirection = Enum("both", "out", "in")
export type GraphTraversalDirection = typeof GraphTraversalDirection["__type__"]

export type GraphSelections = {
  nodes: Selection
  edges: Selection
}

export namespace GraphSelectionPolicy {
  export type Attrs = p.AttrsOf<Props>
  export type Props = SelectionPolicy.Props & {
    node_hops: p.Property<number>
    node_hops_mode: p.Property<GraphTraversalMode>
    node_direction: p.Property<GraphTraversalDirection>
    include_direct: p.Property<boolean>
    include_incident_edges: p.Property<boolean>
    include_end_nodes: p.Property<boolean>
  }
}

export interface GraphSelectionPolicy extends GraphSelectionPolicy.Attrs {}

/** Expands direct graph hits across topology without choosing what is hit. */
export class GraphSelectionPolicy extends SelectionPolicy {
  declare properties: GraphSelectionPolicy.Props

  static {
    this.define<GraphSelectionPolicy.Props>(({Bool, Int}) => ({
      node_hops:             [ NonNegative(Int), 0 ],
      node_hops_mode:        [ GraphTraversalMode, "up_to" ],
      node_direction:        [ GraphTraversalDirection, "both" ],
      include_direct:        [ Bool, true ],
      include_incident_edges: [ Bool, false ],
      include_end_nodes:     [ Bool, false ],
    }))
  }

  private _incident_edges(source: GraphDataSource, node_selection: Selection): Selection {
    const node_ids = new Set(map(node_selection.indices, (index) => source.node_ids[index]))
    const edge_indices = []
    for (let i = 0; i < source.edge_starts.length; i++) {
      if (node_ids.has(source.edge_starts[i]) || node_ids.has(source.edge_ends[i])) {
        edge_indices.push(i)
      }
    }
    return Selection.create({
      indices: edge_indices,
      multiline_indices: new Map(edge_indices.map((index) => [index, [0]])),
    })
  }

  private _traverse_nodes(source: GraphDataSource, direct: Selection): Selection {
    const origins = new Set(map(direct.indices, (index) => source.node_ids[index]))
    let frontier = new Set(origins)
    const visited = new Set(origins)

    for (let depth = 0; depth < this.node_hops; depth++) {
      const next = new Set<unknown>()
      for (let i = 0; i < source.edge_starts.length; i++) {
        const start = source.edge_starts[i]
        const end = source.edge_ends[i]
        if (this.node_direction != "in" && frontier.has(start) && !visited.has(end)) {
          next.add(end)
        }
        if (this.node_direction != "out" && frontier.has(end) && !visited.has(start)) {
          next.add(start)
        }
      }
      for (const id of next) {
        visited.add(id)
      }
      frontier = next
    }

    const node_ids = this.node_hops_mode == "exact" ? frontier : visited
    if (this.include_direct) {
      for (const id of origins) {
        node_ids.add(id)
      }
    } else {
      for (const id of origins) {
        node_ids.delete(id)
      }
    }

    const indices = [...node_ids].map((id) => index_of(source.node_ids, id)).filter((index) => index >= 0)
    return Selection.create({indices})
  }

  private _end_nodes(source: GraphDataSource, edge_selection: Selection): Selection {
    const node_ids = []
    for (const index of edge_selection.indices) {
      node_ids.push(source.edge_starts[index], source.edge_ends[index])
    }
    const indices = uniq(node_ids).map((id) => index_of(source.node_ids, id)).filter((index) => index >= 0)
    return Selection.create({indices})
  }

  expand(source: GraphDataSource, target: GraphSelectionTarget, direct: Selection): GraphSelections {
    if (target == "nodes") {
      const nodes = this._traverse_nodes(source, direct)
      const edges = this.include_incident_edges ? this._incident_edges(source, nodes) : Selection.create()
      return {nodes, edges}
    } else {
      const nodes = this.include_end_nodes ? this._end_nodes(source, direct) : Selection.create()
      const edges = this.include_direct ? direct : Selection.create()
      return {nodes, edges}
    }
  }
}
