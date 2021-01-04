import {Model} from "../../model"
import {View} from "core/view"
import type {AxisView} from "../axes/axis"
import {GraphicsBox, TextBox} from "core/graphics"
import * as p from "core/properties"

export abstract class TickFormatterView extends View {
  model: TickFormatter
  parent: AxisView

  abstract format(ticks: string[] | number[]): string[]

  format_graphics(ticks: string[] | number[]): GraphicsBox[] {
    return this.format(ticks).map((text) => new TextBox({text}))
  }

  compute(tick: string | number): string {
    return this.format([tick] as string[] | number[])[0]
  }

  v_compute(tick: string[] | number[]): string[] {
    return this.format(tick)
  }
}

export namespace TickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {
  properties: TickFormatter.Props
  __view_type__: TickFormatterView

  constructor(attrs?: Partial<TickFormatter.Attrs>) {
    super(attrs)
  }
}
