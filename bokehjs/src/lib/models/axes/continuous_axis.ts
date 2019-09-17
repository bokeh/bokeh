import {Axis} from "./axis"
import * as p from "core/properties"

export namespace ContinuousAxis {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Axis.Props
}

export interface ContinuousAxis extends ContinuousAxis.Attrs {}

export abstract class ContinuousAxis extends Axis {
  properties: ContinuousAxis.Props

  constructor(attrs?: Partial<ContinuousAxis.Attrs>) {
    super(attrs)
  }
}
