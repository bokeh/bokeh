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

  abstract doFormat(ticks: string[] | number[], opts: {loc: number}): string[]

  compute(tick: string | number, opts?: {loc: number}): string {
    return this.doFormat([tick] as string[] | number[], opts ?? {loc: 0})[0]
  }

  v_compute(tick: string[] | number[], opts?: {loc: number}): string[] {
    return this.doFormat(tick, opts ?? {loc: 0})
  }
}
