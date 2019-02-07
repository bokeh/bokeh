import {Model} from "../../model"
import {AxisView} from "../axes/axis"
import * as p from "core/properties"

export namespace TickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {
  properties: TickFormatter.Props

  constructor(attrs?: Partial<TickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TickFormatter"
  }

  abstract doFormat(ticks: string[] | number[], axis_view: AxisView): string[]
}
TickFormatter.initClass()
