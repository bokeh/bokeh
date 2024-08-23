import {Axis, AxisView} from "./axis"
import type * as p from "core/properties"

export abstract class ContinuousAxisView extends AxisView {
  declare model: ContinuousAxis

  protected  _hit_value(sx: number, sy: number): any | null {
    const [range] = this.ranges
    const {start, end, span} = range
    switch (this.dimension) {
      case 0: {
        const {x0, width} = this.bbox
        return span * (sx - x0) / width + start
      }
      case 1: {
        const {y0, height} = this.bbox
        return end - span * (sy - y0) / height
      }
    }
  }
}

export namespace ContinuousAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Axis.Props
}

export interface ContinuousAxis extends ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {
  declare properties: ContinuousAxis.Props
  declare __view_type__: ContinuousAxisView

  constructor(attrs?: Partial<ContinuousAxis.Attrs>) {
    super(attrs)
  }
}
