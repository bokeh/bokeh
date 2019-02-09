import {Model} from "../../model"
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

  abstract doFormat(ticks: string[] | number[], opts: {loc: number}): string[]
}
TickFormatter.initClass()
