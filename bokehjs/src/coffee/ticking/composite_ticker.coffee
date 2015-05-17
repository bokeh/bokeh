_ = require "underscore"
AbstractTicker = require "./abstract_ticker"
{argmin} = require "./util"

# This Ticker takes a collection of Tickers and picks the one most appropriate
# for a given range.
class CompositeTicker extends AbstractTicker.Model
  type: 'CompositeTicker'

  # The tickers should be in order of increasing interval size; specifically,
  # if S comes before T, then it should be the case that
  # S.get_max_interval() < T.get_min_interval().
  # FIXME Enforce this automatically.
  initialize: (attrs, options) ->
    super(attrs, options)

    tickers = @get('tickers')
    @register_property('min_intervals',
        () -> _.invoke(tickers, 'get_min_interval')
      , true)
    @add_dependencies('min_intervals', this, ['tickers'])

    @register_property('max_intervals',
        () -> _.invoke(tickers, 'get_max_interval')
      , true)
    @add_dependencies('max_intervals', this, ['tickers'])

    @register_property('min_interval',
        () -> _.first(@get('min_intervals'))
      , true)
    @add_dependencies('min_interval', this, ['min_intervals'])

    @register_property('max_interval',
        () -> _.first(@get('max_intervals'))
      , true)
    @add_dependencies('max_interval', this, ['max_interval'])

  get_best_ticker: (data_low, data_high, desired_n_ticks) ->
    data_range = data_high - data_low
    ideal_interval = @get_ideal_interval(data_low, data_high,
                                         desired_n_ticks)
    ticker_ndxs = [
      _.sortedIndex(@get('min_intervals'), ideal_interval) - 1,
      _.sortedIndex(@get('max_intervals'), ideal_interval)
    ]
    intervals = [@get('min_intervals')[ticker_ndxs[0]],
                 @get('max_intervals')[ticker_ndxs[1]]]
    errors = intervals.map((interval) ->
      return Math.abs(desired_n_ticks - (data_range / interval)))

    # this can happen if the data isn't loaded yet, we just default to
    # the first scale
    best_index = argmin(errors)
    if best_index == Infinity
      return @get('tickers')[0]
    best_ticker_ndx = ticker_ndxs[best_index]
    best_ticker = @get('tickers')[best_ticker_ndx]

    return best_ticker

  get_interval: (data_low, data_high, desired_n_ticks) ->
    best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
    return best_ticker.get_interval(data_low, data_high, desired_n_ticks)

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    best_ticker = @get_best_ticker(data_low, data_high, desired_n_ticks)
    ticks = best_ticker.get_ticks_no_defaults(data_low, data_high, desired_n_ticks)
    return ticks

module.exports =
  Model: CompositeTicker