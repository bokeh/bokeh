import {Model} from "../../model"
import {GraphDataSource} from "../sources/graph_data_source"
import {CoordinateTransform} from "models/expressions/coordinate_transform"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export type NodeLayout = Map<unknown, Arrayable<number>>

export namespace LayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface LayoutProvider extends LayoutProvider.Attrs {}

export abstract class LayoutProvider extends Model {
  declare properties: LayoutProvider.Props

  private _layouts = new WeakMap<GraphDataSource, NodeLayout>()

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => this.invalidate())
  }

  protected abstract _compute_layout(source: GraphDataSource): NodeLayout

  invalidate(source?: GraphDataSource): void {
    if (source == null) {
      this._layouts = new WeakMap()
    } else {
      this._layouts.delete(source)
    }
  }

  get_layout(source: GraphDataSource): NodeLayout {
    let layout = this._layouts.get(source)
    if (layout == null) {
      const computed = this._compute_layout(source)
      layout = new Map()
      for (const [id, coordinates] of computed) {
        const index = source.node_index(id)
        if (index != null) {
          layout.set(source.node_ids[index], coordinates)
        }
      }
      this._layouts.set(source, layout)
    }
    return layout
  }

  get_node_coordinates(source: GraphDataSource): [Arrayable<number>, Arrayable<number>] {
    const index = source.node_ids
    const n = index.length
    const xs = new Float64Array(n)
    const ys = new Float64Array(n)
    const layout = this.get_layout(source)
    for (let i = 0; i < n; i++) {
      const [x, y] = layout.get(index[i]) ?? [NaN, NaN]
      xs[i] = x
      ys[i] = y
    }
    return [xs, ys]
  }

  node_coordinates(source: GraphDataSource): NodeCoordinates {
    return NodeCoordinates.create({layout: this, source})
  }
}

export namespace GraphCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateTransform.Props & {
    layout: p.Property<LayoutProvider>
    source: p.Property<GraphDataSource>
  }
}

export interface GraphCoordinates extends GraphCoordinates.Attrs {}

export abstract class GraphCoordinates extends CoordinateTransform {
  declare properties: GraphCoordinates.Props

  static {
    this.define<GraphCoordinates.Props>(({Ref}) => ({
      layout: [ Ref(LayoutProvider)],
      source: [ Ref(GraphDataSource)],
    }))
  }
}

export namespace NodeCoordinates {
  export type Attrs = p.AttrsOf<Props>
  export type Props = GraphCoordinates.Props
}

export interface NodeCoordinates extends NodeCoordinates.Attrs {}

export class NodeCoordinates extends GraphCoordinates {
  declare properties: NodeCoordinates.Props

  _v_compute(): {x: Arrayable<number>, y: Arrayable<number>} {
    const [x, y] = this.layout.get_node_coordinates(this.source)
    return {x, y}
  }
}
