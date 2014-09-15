define [
  "ticking/adaptive_ticker",
], (AdaptiveTicker) ->

  class BasicTicker extends AdaptiveTicker.Model
    type: 'BasicTicker'

    initialize: (attrs, options) ->
      super(attrs, options)

    defaults: ->
      _.extend {}, super(), {
        mantissas: [1,2,5]
      }

  class BasicTickers extends Backbone.Collection
    model: BasicTicker

  return {
    "Model": BasicTicker,
    "Collection": new BasicTickers()
  }

