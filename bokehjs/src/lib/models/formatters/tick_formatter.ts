import {Model} from "../../model"
import type {Ticker} from "../tickers/ticker"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import type {BaseText} from "../text/base_text"
import type * as p from "core/properties"

export namespace TickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props

  export type Context = {
    loc: number
    ticker?: Ticker
    resolve_text?: (text: BaseText) => GraphicsBox | null
  }
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {
  declare properties: TickFormatter.Props

  abstract doFormat(ticks: string[] | number[], opts: TickFormatter.Context): string[]

  get_text_models(): BaseText[] {
    return []
  }

  format_graphics(ticks: string[] | number[], opts: TickFormatter.Context): GraphicsBox[] {
    return this.doFormat(ticks, opts).map((text) => new TextBox({text}))
  }

  compute(tick: string | number, opts?: TickFormatter.Context): string {
    return this.doFormat([tick] as string[] | number[], opts ?? {loc: 0})[0]
  }

  v_compute(tick: string[] | number[], opts?: TickFormatter.Context): string[] {
    return this.doFormat(tick, opts ?? {loc: 0})
  }
}
