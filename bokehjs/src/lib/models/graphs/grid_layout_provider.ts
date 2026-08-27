import {LayoutProvider} from "./layout_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type * as p from "core/properties"

export namespace GridLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    center: p.Property<[number, number]>
    spacing: p.Property<number>
    columns: p.Property<number | null>
  }
}

export interface GridLayoutProvider extends GridLayoutProvider.Attrs {}

/** Place nodes on a centered row-major grid in source order. */
export class GridLayoutProvider extends LayoutProvider {
  declare properties: GridLayoutProvider.Props

  static {
    this.define<GridLayoutProvider.Props>(({Float, Int, Nullable, Positive, Tuple}) => ({
      center:  [ Tuple(Float, Float), [0, 0] ],
      spacing: [ Positive(Float), 1 ],
      columns: [ Nullable(Positive(Int)), null ],
    }))
  }

  protected _compute_layout(source: GraphDataSource): NodeLayout {
    const ids = source.node_ids
    const layout: NodeLayout = new Map()
    if (ids.length == 0) {
      return layout
    }

    const columns = this.columns ?? Math.ceil(Math.sqrt(ids.length))
    const rows = Math.ceil(ids.length/columns)
    const [cx, cy] = this.center
    const x0 = cx - (columns - 1)*this.spacing/2
    const y0 = cy + (rows - 1)*this.spacing/2
    for (let i = 0; i < ids.length; i++) {
      const column = i % columns
      const row = Math.floor(i/columns)
      layout.set(ids[i], [x0 + column*this.spacing, y0 - row*this.spacing])
    }
    return layout
  }
}
