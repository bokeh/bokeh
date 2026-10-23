import {LayoutProvider} from "./layout_provider"
import type {NodeLayout} from "./layout_provider"
import type {GraphDataSource} from "../sources/graph_data_source"
import type * as p from "core/properties"

export namespace CircularLayoutProvider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutProvider.Props & {
    center: p.Property<[number, number]>
    radius: p.Property<number>
    start_angle: p.Property<number>
    clockwise: p.Property<boolean>
  }
}

export interface CircularLayoutProvider extends CircularLayoutProvider.Attrs {}

/** Place nodes evenly around a circle in source order. */
export class CircularLayoutProvider extends LayoutProvider {
  declare properties: CircularLayoutProvider.Props

  static {
    this.define<CircularLayoutProvider.Props>(({Bool, Float, NonNegative, Tuple}) => ({
      center:      [ Tuple(Float, Float), [0, 0] ],
      radius:      [ NonNegative(Float), 1 ],
      start_angle: [ Float, 0 ],
      clockwise:   [ Bool, false ],
    }))
  }

  protected _compute_layout(source: GraphDataSource): NodeLayout {
    const ids = source.node_ids
    const layout: NodeLayout = new Map()
    const [cx, cy] = this.center
    const direction = this.clockwise ? -1 : 1
    const step = ids.length == 0 ? 0 : 2*Math.PI/ids.length
    for (let i = 0; i < ids.length; i++) {
      const angle = this.start_angle + direction*i*step
      layout.set(ids[i], [cx + this.radius*Math.cos(angle), cy + this.radius*Math.sin(angle)])
    }
    return layout
  }
}
