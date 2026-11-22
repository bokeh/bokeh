import {Model} from "../../model"
import type {Ticker} from "../tickers/ticker"
import type {GraphicsBox} from "core/graphics"
import {TextBox} from "core/graphics"
import {logger} from "core/logging"
import type {BaseText} from "../text/base_text"
import type * as p from "core/properties"

export type TickFormatterTransform = "scaled" | "si"

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

  protected _reported_incompatible_formatter = false

  get transform_kind(): TickFormatterTransform | null {
    return null
  }

  protected formatter_is_compatible(formatter: TickFormatter): boolean {
    const outer = this.transform_kind
    const inner = formatter.transform_kind
    return outer == null || inner == null || outer == inner
  }

  protected check_formatter(formatter: TickFormatter): boolean {
    const compatible = this.formatter_is_compatible(formatter)
    if (!compatible && !this._reported_incompatible_formatter) {
      logger.error("SITickFormatter and ScaledTickFormatter cannot be nested; using the inner formatter only")
      this._reported_incompatible_formatter = true
    }
    return compatible
  }

  abstract doFormat(ticks: string[] | number[], opts: TickFormatter.Context): string[]

  get_text_models(_opts?: TickFormatter.Context): BaseText[] {
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
