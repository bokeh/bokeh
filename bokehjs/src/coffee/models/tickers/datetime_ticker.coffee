_ = require "underscore"
AdaptiveTicker = require "./adaptive_ticker"
CompositeTicker = require "./composite_ticker"
DaysTicker = require "./days_ticker"
MonthsTicker = require "./months_ticker"
YearsTicker = require "./years_ticker"
util = require "./util"

ONE_MILLI = util.ONE_MILLI
ONE_SECOND = util.ONE_SECOND
ONE_MINUTE = util.ONE_MINUTE
ONE_HOUR = util.ONE_HOUR
ONE_MONTH = util.ONE_MONTH

# This is a decent ticker for time data (in milliseconds).
# It could certainly be improved:
# FIXME There should probably be a special ticker for years.
# FIXME Some of the adaptive tickers probably have too many mantissas, which
# leads to too-frequent tick transitions.
class DatetimeTicker extends CompositeTicker.Model
  type: 'DatetimeTicker'

  defaults: () ->
    return _.extend {}, super(), {
      num_minor_ticks: 0
      tickers: [
        # Sub-second.
        new AdaptiveTicker.Model({
          mantissas: [1, 2, 5],
          base: 10,
          min_interval: 0,
          max_interval: 500 * ONE_MILLI
          num_minor_ticks: 0
        }),

        # Seconds, minutes.
        new AdaptiveTicker.Model({
          mantissas: [1, 2, 5, 10, 15, 20, 30],
          base: 60,
          min_interval: ONE_SECOND,
          max_interval: 30 * ONE_MINUTE
          num_minor_ticks: 0
        }),

        # Hours.
        new AdaptiveTicker.Model({
          mantissas: [1, 2, 4, 6, 8, 12],
          base: 24.0,
          min_interval: ONE_HOUR,
          max_interval: 12 * ONE_HOUR
          num_minor_ticks: 0
        }),

        # Days.
        new DaysTicker.Model({days: _.range(1, 32)}),
        new DaysTicker.Model({days: _.range(1, 31, 3)}),
        new DaysTicker.Model({days: [1, 8, 15, 22]}),
        new DaysTicker.Model({days: [1, 15]}),

        # Months.
        new MonthsTicker.Model({months: _.range(0, 12, 1)}),
        new MonthsTicker.Model({months: _.range(0, 12, 2)}),
        new MonthsTicker.Model({months: _.range(0, 12, 4)}),
        new MonthsTicker.Model({months: _.range(0, 12, 6)}),

        # Years
        new YearsTicker.Model({})
      ]
    }

module.exports =
  Model: DatetimeTicker