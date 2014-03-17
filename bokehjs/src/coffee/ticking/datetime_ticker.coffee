define [
  "ticking/tickers",
], (tickers) ->

  # This is a decent ticker for time data (in milliseconds).
  # It could certainly be improved:
  # FIXME There should probably be a special ticker for years.
  # FIXME Some of the adaptive tickers probably have too many mantissas, which
  # leads to too-frequent tick transitions.
  class DatetimeTicker extends tickers.CompositeTicker
    constructor: () ->
      super([
        # Sub-second.
        new tickers.AdaptiveTicker([1, 2, 5], 10, 0, 500 * tickers.ONE_MILLI),

        # Seconds, minutes.
        new tickers.AdaptiveTicker([1, 2, 5, 10, 15, 20, 30], 60, tickers.ONE_SECOND, 30 * tickers.ONE_MINUTE),

        # Hours.
        new tickers.AdaptiveTicker([1, 2, 4, 6, 8, 12], 24.0, tickers.ONE_HOUR, 12 * tickers.ONE_HOUR),

        # Days.
        new tickers.DaysTicker(tickers.arange(1, 32)),
        new tickers.DaysTicker(tickers.arange(1, 31, 3)),
        new tickers.DaysTicker([1, 8, 15, 22]),
        new tickers.DaysTicker([1, 15]),

        # Months.
        new tickers.MonthsTicker(tickers.arange(0, 12)),
        new tickers.MonthsTicker(tickers.arange(0, 12, 2)),
        new tickers.MonthsTicker(tickers.arange(0, 12, 4)),
        new tickers.MonthsTicker(tickers.arange(0, 12, 6)),

        # Catchall for large timetickers.
        new tickers.AdaptiveTicker([1, 2, 5], 10, tickers.ONE_YEAR, Infinity),
      ])

  class DatetimeTickers extends Backbone.Collection
    model: DatetimeTicker

    defaults: () ->
      super()

  return {
    "Model": DatetimeTicker,
    "Collection": new DatetimeTickers()
  }
