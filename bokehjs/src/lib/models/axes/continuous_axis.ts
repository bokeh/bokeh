import {Axis, AxisView} from "./axis"
import * as p from "core/properties"

export abstract class ContinuousAxisView extends AxisView {
  model: ContinuousAxis
}

export namespace ContinuousAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Axis.Props
}

export interface ContinuousAxis extends ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {
  properties: ContinuousAxis.Props
  __view_type__: ContinuousAxisView

  constructor(attrs?: Partial<ContinuousAxis.Attrs>) {
    super(attrs)
  }
}
