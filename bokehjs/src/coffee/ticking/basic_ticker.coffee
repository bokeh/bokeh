define [
  "ticking/tickers",
], (tickers) ->

  class BasicTicker extends tickers.AdaptiveTicker
    constructor: () ->
      super([1, 2, 5])

  class BasicTickers extends Backbone.Collection
    model: BasicTicker

    defaults: () ->
      super()

  return {
    "Model": BasicTicker,
    "Collection": new BasicTickers()
  }

