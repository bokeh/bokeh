define [
  "ticking/tickers",
], (tickers) ->

  # This is a decent ticker for time data (in milliseconds).
  # It could certainly be improved:
  # FIXME There should probably be a special ticker for years.
  # FIXME Some of the adaptive tickers probably have too many mantissas, which
  # leads to too-frequent tick transitions.
  class DatetimeTicker extends tickers.CompositeTicker
    type: 'DatetimeTicker'
    initialize: (attrs, options) ->
      super(attrs, options)

    defaults: () ->
      return _.extend(super(), {
        tickers: [
          # Sub-second.
          new tickers.AdaptiveTicker({
            mantissas: [1, 2, 5],
            base: 10,
            min_interval: 0,
            max_interval: 500 * tickers.ONE_MILLI
          }),

          # Seconds, minutes.
          new tickers.AdaptiveTicker({
            mantissas: [1, 2, 5, 10, 15, 20, 30],
            base: 60,
            min_interval: tickers.ONE_SECOND,
            max_interval: 30 * tickers.ONE_MINUTE
          }),

          # Hours.
          new tickers.AdaptiveTicker({
            mantissasL: [1, 2, 4, 6, 8, 12],
            base: 24.0,
            min_interval: tickers.ONE_HOUR,
            max_interval: 12 * tickers.ONE_HOUR
          }),

          # Days.
          new tickers.DaysTicker({days: tickers.arange(1, 32)}),
          new tickers.DaysTicker({days: tickers.arange(1, 31, 3)}),
          new tickers.DaysTicker({days: [1, 8, 15, 22]}),
          new tickers.DaysTicker({days: [1, 15]}),

          # Months.
          new tickers.MonthsTicker({months: tickers.arange(0, 12)}),
          new tickers.MonthsTicker({months: tickers.arange(0, 12, 2)}),
          new tickers.MonthsTicker({months: tickers.arange(0, 12, 4)}),
          new tickers.MonthsTicker({months: tickers.arange(0, 12, 6)}),

          # Catchall for large timetickers.
          new tickers.AdaptiveTicker({
            mantissas: [1, 2, 5],
            base: 10,
            min_interval: tickers.ONE_YEAR,
            max_interval: Infinity
          }),
        ]
      })

  class DatetimeTickers extends Backbone.Collection
    model: DatetimeTicker

    defaults: () ->
      super()

  return {
    "Model": DatetimeTicker,
    "Collection": new DatetimeTickers()
  }
