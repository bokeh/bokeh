import {Model} from "../../model"
import {AxisView} from "../axes/axis"

export namespace TickFormatter {
  export interface Attrs extends Model.Attrs {}

  export interface Props extends Model.Props {}
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {

  constructor(attrs?: Partial<TickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TickFormatter"
  }

  abstract doFormat(ticks: string[] | number[], axis_view: AxisView): string[]
}
TickFormatter.initClass()
