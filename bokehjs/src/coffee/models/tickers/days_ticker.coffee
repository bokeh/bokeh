import {SingleIntervalTicker} from "./single_interval_ticker"
import * as util from "./util"
import * as p from "core/properties"
import {concat} from "core/util/array"

copy_date = util.copy_date
last_month_no_later_than = util.last_month_no_later_than
ONE_DAY = util.ONE_DAY

# Given a start and end time in millis, returns the shortest array of
# consecutive months (as Dates) that surrounds both times.
date_range_by_month = (start_time, end_time) ->
  start_date = last_month_no_later_than(new Date(start_time))

  end_date = last_month_no_later_than(new Date(end_time))
  # XXX This is not a reliable technique in general, but it should be
  # safe when the day of the month is 1.  (The problem case is this:
  # Mar 31 -> Apr 31, which becomes May 1.)
  prev_end_date = copy_date(end_date)
  end_date.setUTCMonth(end_date.getUTCMonth() + 1)

  dates = []
  date = start_date
  while true
    dates.push(copy_date(date))

    date.setUTCMonth(date.getUTCMonth() + 1)
    if date > end_date
      break

  return dates

# A DaysTicker produces ticks from a fixed subset of calendar days.
# E.g., DaysTicker([1, 15]) produces ticks on the 1st and 15th days of each
# month.
export class DaysTicker extends SingleIntervalTicker
  type: 'DaysTicker'

  @define {
      days: [ p.Array, [] ]
    }

  initialize: (attrs, options) ->
    attrs.num_minor_ticks = 0
    super(attrs, options)
    days = @days
    interval = if days.length > 1
        (days[1] - days[0]) * ONE_DAY
      else
        31 * ONE_DAY
    @interval = interval

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    month_dates = date_range_by_month(data_low, data_high)

    days = @days
    days_of_month = (month_date, interval) =>
      dates = []
      for day in days
        day_date = copy_date(month_date)
        day_date.setUTCDate(day)
        # We can't use all of the values in @days, because they may not
        # fall within the current month.  In fact, if, e.g., our month is 28 days
        # and we're marking every third day, we don't want day 28 to show up
        # because it'll be right next to the 1st of the next month.  So we
        # make sure we have a bit of room before we include a day.
        future_date = new Date(day_date.getTime() + (interval / 2))
        if future_date.getUTCMonth() == month_date.getUTCMonth()
          dates.push(day_date)
      return dates

    interval = @interval
    day_dates = concat((days_of_month(date, interval) for date in month_dates))

    all_ticks = (day_date.getTime() for day_date in day_dates)
    # FIXME Since the ticks are sorted, this could be done more efficiently.
    ticks_in_range = all_ticks.filter((tick) -> data_low <= tick <= data_high)

    return {
      "major": ticks_in_range,
      "minor": []
    }
