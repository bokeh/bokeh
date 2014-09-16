define [
  "common/collection",
  "ticking/adaptive_ticker",
], (Collection, AdaptiveTicker) ->

  class BasicTicker extends AdaptiveTicker.Model
    type: 'BasicTicker'

    initialize: (attrs, options) ->
      super(attrs, options)

    defaults: ->
      return _.extend {}, super(), {
        mantissas: [1,2,5]
      }

  class BasicTickers extends Collection
    model: BasicTicker

  return {
    "Model": BasicTicker,
    "Collection": new BasicTickers()
  }

