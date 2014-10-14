define [
  "underscore",
  "common/collection",
  "ticking/abstract_ticker",
  "ticking/util",
], (_, Collection, AbstractTicker, util) ->

  argmin = util.argmin

  # Forces a number x into a specified range [min_val, max_val].
  clamp = (x, min_val, max_val) ->
    return Math.max(min_val, Math.min(max_val, x))

  # A log function with an optional base.
  log = (x, base=Math.E) ->
    return Math.log(x) / Math.log(base)

  # This Ticker produces nice round ticks at any magnitude.
  # AdaptiveTicker([1, 2, 5]) will choose the best tick interval from the
  # following:
  # ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...
  class AdaptiveTicker extends AbstractTicker.Model
    type: 'AdaptiveTicker'

    # These arguments control the range of possible intervals.  The interval I
    # returned by get_interval() will be the one that most closely matches the
    # desired number of ticks, subject to the following constraints:
    # I = (M * B^N), where
    # M is a member of mantissas,
    # B is base,
    # and N is an integer;
    # and min_interval <= I <= max_interval.
    initialize: (attrs, options) ->
      super(attrs, options)
      prefix_mantissa =  _.last(@get('mantissas')) / @get('base')
      suffix_mantissa = _.first(@get('mantissas')) * @get('base')
      @extended_mantissas = _.flatten([prefix_mantissa, @get('mantissas'), suffix_mantissa])

      @base_factor = if @get('min_interval') == 0.0 then 1.0 else @get('min_interval')

    get_interval: (data_low, data_high, desired_n_ticks) ->
      data_range = data_high - data_low
      ideal_interval = @get_ideal_interval(data_low, data_high, desired_n_ticks)

      interval_exponent = Math.floor(log(ideal_interval / @base_factor, @get('base')))
      ideal_magnitude = Math.pow(@get('base'), interval_exponent) * @base_factor
      ideal_mantissa = ideal_interval / ideal_magnitude

      # An untested optimization.
#       index = _.sortedIndex(@extended_mantissas, ideal_mantissa)
#       candidate_mantissas = @extended_mantissas[index..index + 1]
      candidate_mantissas = @extended_mantissas

      errors = candidate_mantissas.map((mantissa) ->
        Math.abs(desired_n_ticks - (data_range / (mantissa * ideal_magnitude))))
      best_mantissa = candidate_mantissas[argmin(errors)]

      interval = best_mantissa * ideal_magnitude

      return clamp(interval, @get('min_interval'), @get('max_interval'))

    defaults: ->
      return _.extend {}, super(), {
        toString_properties: ['mantissas', 'base', 'min_magnitude', 'max_magnitude'],
        base: 10.0,
        mantissas: [2, 5, 10]
        min_interval: 0.0,
        max_interval: Infinity,
      }

  class AdaptiveTickers extends Collection
    model: AdaptiveTicker

  return {
    "Model": AdaptiveTicker,
    "Collection": new AdaptiveTickers()
  }
