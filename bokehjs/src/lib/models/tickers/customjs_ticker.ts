import type {FactorTickSpec} from "./categorical_ticker"
import type {TickSpec} from "./ticker"
import {Ticker} from "./ticker"
import {FactorRange} from "../ranges/factor_range"
import type {Range} from "../ranges/range"
import type * as p from "core/properties"
import type {Dict} from "core/types"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

type MajorCBData = {
  start: number
  end: number
  range: Range
  cross_loc: number
}

type MinorCBData = MajorCBData & {
  major_ticks: any[]
}

export namespace CustomJSTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Ticker.Props & {
    args: p.Property<Dict<unknown>>
    major_code: p.Property<string>
    minor_code: p.Property<string>
  }
}

export interface CustomJSTicker extends CustomJSTicker.Attrs {}

export class CustomJSTicker extends Ticker {
  declare properties: CustomJSTicker.Props

  constructor(attrs?: Partial<CustomJSTicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSTicker.Props>(({Unknown, Str, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      major_code: [ Str, "" ],
      minor_code: [ Str, "" ],
    }))
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): unknown[] {
    return values(this.args)
  }

  get_ticks(start: number, end: number, range: Range, cross_loc: number): TickSpec<number> | FactorTickSpec {
    const major_cb_data = {start, end, range, cross_loc}
    const major_ticks = this.major_ticks(major_cb_data)

    // CustomJSTicker for categorical axes only support a single level of major ticks
    if (range instanceof FactorRange) {
      return {major: major_ticks, minor: [], tops: [], mids: []}
    }

    const minor_cb_data = {major_ticks, ...major_cb_data}
    const minor_ticks = this.minor_ticks(minor_cb_data)

    return {
      major: major_ticks,
      minor: minor_ticks,
    }
  }

  protected major_ticks(cb_data: MajorCBData): any[] {
    if (this.major_code == "") {
      return []
    }
    const code = use_strict(this.major_code)
    const func = new Function("cb_data", ...this.names, code)
    return func(cb_data, ...this.values)
  }

  protected minor_ticks(cb_data: MinorCBData): any[] {
    if (this.minor_code == "") {
      return []
    }
    const code = use_strict(this.minor_code)
    const func = new Function("cb_data", ...this.names, code)
    return func(cb_data, ...this.values)
  }

}
