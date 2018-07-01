import {TickSpec} from "./ticker"
import {SingleIntervalTicker} from "./single_interval_ticker"
import {copy_date,last_month_no_later_than,ONE_DAY} from "./util"
import * as p from "core/properties"
import {concat} from "core/util/array"

// Given a start and end time in millis, returns the shortest array of
// consecutive months (as Dates) that surrounds both times.
function date_range_by_month(start_time: number, end_time: number): Date[] {
  const start_date = last_month_no_later_than(new Date(start_time))
  const end_date = last_month_no_later_than(new Date(end_time))

  // XXX This is not a reliable technique in general, but it should be
  // safe when the day of the month is 1.  (The problem case is this:
  // Mar 31 -> Apr 31, which becomes May 1.)
  end_date.setUTCMonth(end_date.getUTCMonth() + 1)

  const dates = []
  const date = start_date
  while (true) {
    dates.push(copy_date(date))

    date.setUTCMonth(date.getUTCMonth() + 1)
    if (date > end_date)
      break
  }

  return dates
}

// A DaysTicker produces ticks from a fixed subset of calendar days.
// E.g., DaysTicker([1, 15]) produces ticks on the 1st and 15th days of each
// month.

export namespace DaysTicker {
  export interface Attrs extends SingleIntervalTicker.Attrs {
    days: number[]
  }

  export interface Props extends SingleIntervalTicker.Props {}
}

export interface DaysTicker extends DaysTicker.Attrs {}

export class DaysTicker extends SingleIntervalTicker {

  properties: DaysTicker.Props

  constructor(attrs?: Partial<DaysTicker.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DaysTicker"

    this.define({
      days: [ p.Array, [] ],
    })

    this.override({
      num_minor_ticks: 0,
    })
  }

  initialize(): void {
    super.initialize()
    const days = this.days
    if (days.length > 1)
      this.interval = (days[1] - days[0])*ONE_DAY
    else
      this.interval = 31*ONE_DAY
  }

  get_ticks_no_defaults(data_low: number, data_high: number, _cross_loc: any, _desired_n_ticks: number): TickSpec<number> {
    const month_dates = date_range_by_month(data_low, data_high)

    const days = this.days
    const days_of_month = (month_date: Date, interval: number) => {
      const current_month = month_date.getUTCMonth()
      const dates = []
      for (const day of days) {
        const day_date = copy_date(month_date)
        day_date.setUTCDate(day)
        // We can't use all of the values in this.days, because they may not
        // fall within the current month.  In fact, if, e.g., our month is 28 days
        // and we're marking every third day, we don't want day 28 to show up
        // because it'll be right next to the 1st of the next month.  So we
        // make sure we have a bit of room before we include a day.

        // TODO (bev) The above description does not exactly work because JS Date
        // is broken and will happily consider "Feb 28 + 3*ONE_DAY" to have month "2"
        const future_date = new Date(day_date.getTime() + (interval / 2))
        if (future_date.getUTCMonth() == current_month)
          dates.push(day_date)
      }
      return dates
    }

    const interval = this.interval
    const day_dates = concat(month_dates.map((date) => days_of_month(date, interval)))

    const all_ticks = day_dates.map((day_date) => day_date.getTime())
    const ticks_in_range = all_ticks.filter((tick) => data_low <= tick && tick <= data_high)

    return {
      major: ticks_in_range,
      minor: [],
    }
  }
}

DaysTicker.initClass()
