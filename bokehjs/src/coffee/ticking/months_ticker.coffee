_ = require "underscore"
SingleIntervalTicker = require "./single_interval_ticker"
util = require "./util"

copy_date = util.copy_date
last_year_no_later_than = util.last_year_no_later_than
ONE_MONTH = util.ONE_MONTH

# Given a start and end time in millis, returns the shortest array of
# consecutive years (as Dates) that surrounds both times.
date_range_by_year = (start_time, end_time) ->
  start_date = last_year_no_later_than(new Date(start_time))

  end_date = last_year_no_later_than(new Date(end_time))
  end_date.setUTCFullYear(end_date.getUTCFullYear() + 1)

  dates = []
  date = start_date
  while true
    dates.push(copy_date(date))

    date.setUTCFullYear(date.getUTCFullYear() + 1)
    if date > end_date
      break

  return dates

# A MonthsTicker produces ticks from a fixed subset of months of the year.
# E.g., MonthsTicker([0, 3, 6, 9]) produces ticks of the 1st of January,
# April, July, and October of each year.
class MonthsTicker extends SingleIntervalTicker.Model
  type: 'MonthsTicker'

  initialize: (attrs, options) ->
    super(attrs, options)
    months = @get('months')
    interval = if months.length > 1
        (months[1] - months[0]) * ONE_MONTH
      else
        12 * ONE_MONTH
    @set('interval', interval)

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    year_dates = date_range_by_year(data_low, data_high)

    months = @get('months')
    months_of_year = (year_date) ->
      return months.map((month) ->
        month_date = copy_date(year_date)
        month_date.setUTCMonth(month)
        return month_date)

    month_dates = _.flatten(months_of_year(date) for date in year_dates)

    all_ticks = _.invoke(month_dates, 'getTime')
    ticks_in_range = _.filter(all_ticks,
                              ((tick) -> data_low <= tick <= data_high))

    return {
      "major": ticks_in_range,
      "minor": []
    }

  defaults: () ->
    return _.extend {}, super(), {
      toString_properties: ['months']
    }

module.exports =
  Model: MonthsTicker