define [
  "ticking/tickers",
], (tickers) ->

  class BasicTicker extends tickers.AdaptiveTicker
    type: 'BasicTicker'
    initialize: (attrs, options) ->
      super(attrs, options)

    defaults: () ->
      return _.extend(super(), {
        mantissas: [1,2,5]
      })

  class BasicTickers extends Backbone.Collection
    model: BasicTicker

  return {
    "Model": BasicTicker,
    "Collection": new BasicTickers()
  }

