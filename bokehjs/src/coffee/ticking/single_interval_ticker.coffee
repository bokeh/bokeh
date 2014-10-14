define [
  "underscore",
  "common/collection",
  "ticking/abstract_ticker",
], (_, Collection, AbstractTicker) ->

  # The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
  # regardless of the input range.  It's not very useful by itself, but can
  # be used as part of a CompositeTicker below.
  class SingleIntervalTicker extends AbstractTicker.Model
    type: 'SingleIntervalTicker'

    initialize: (attrs, options) ->
      super(attrs, options)
      @register_property('min_interval',
          () -> @get('interval')
        , true)
      @add_dependencies('min_interval', this, ['interval'])

      @register_property('max_interval',
          () -> @get('interval')
        , true)
      @add_dependencies('max_interval', this, ['interval'])

    get_interval: (data_low, data_high, n_desired_ticks) ->
      return @get('interval')

    defaults: ->
      return _.extend {}, super(), {
        toString_properties: ['interval']
      }

  class SingleIntervalTickers extends Collection
    model: SingleIntervalTicker

  return {
    "Model": SingleIntervalTicker,
    "Collection": new SingleIntervalTickers()
  }
