import {Axis, AxisView} from "./axis"
import type * as p from "core/properties"

export abstract class ContinuousAxisView extends AxisView {
  declare model: ContinuousAxis
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
