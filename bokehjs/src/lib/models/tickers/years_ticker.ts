import {TickSpec} from "./ticker"
import {BasicTicker} from "./basic_ticker"
import {SingleIntervalTicker} from "./single_interval_ticker"
import {last_year_no_later_than, ONE_YEAR} from "./util"

export namespace YearsTicker {
  export interface Attrs extends SingleIntervalTicker.Attrs {}

  export interface Props extends SingleIntervalTicker.Props {}
}

export interface YearsTicker extends YearsTicker.Attrs {}

export class YearsTicker extends SingleIntervalTicker {

  properties: YearsTicker.Props

  constructor(attrs?: Partial<YearsTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "YearsTicker"
  }

  protected basic_ticker: BasicTicker

  initialize(): void {
    super.initialize()
    this.interval = ONE_YEAR
    this.basic_ticker = new BasicTicker({num_minor_ticks: 0})
  }

  get_ticks_no_defaults(data_low: number, data_high: number, cross_loc: any, desired_n_ticks: number): TickSpec<number> {
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

YearsTicker.initClass()
