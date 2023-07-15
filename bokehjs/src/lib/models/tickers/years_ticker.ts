import type {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {BaseSingleIntervalTicker} from "./single_interval_ticker"
import {last_year_no_later_than, ONE_YEAR} from "./util"
import type * as p from "core/properties"

export namespace YearsTicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseSingleIntervalTicker.Props
}

export interface YearsTicker extends YearsTicker.Attrs {}

export class YearsTicker extends BaseSingleIntervalTicker {
  declare properties: YearsTicker.Props

  constructor(attrs?: Partial<YearsTicker.Attrs>) {
    super(attrs)
  }

  readonly interval = ONE_YEAR
  readonly basic_ticker = new BasicTicker({num_minor_ticks: 0})

  override get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: number, desired_n_ticks: number): TickSpec<number> {
    const start_year = last_year_no_later_than(new Date(data_low)).getUTCFullYear()
    const end_year = last_year_no_later_than(new Date(data_high)).getUTCFullYear()

    const years = this.basic_ticker.get_ticks_no_defaults(start_year, end_year, cross_loc, desired_n_ticks).major

    const all_ticks = years.map((year) => Date.UTC(year, 0, 1))
    const ticks_in_range = all_ticks.filter((tick) => data_low <= tick && tick <= data_high)

    return {
      major: ticks_in_range,
      minor: [],
    }
  }
}
