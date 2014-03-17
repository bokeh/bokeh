
define [
  "underscore",
  "backbone",
  "./axis"
  "ticking/basic_tick_formatter",
  "ticking/tickers",
], (_, Backbone, Axis, BasicTickFormatter, tickers) ->

  class LinearAxisView extends Axis.View
    initialize: (options) ->
      options.formatter = new BasicTickFormatter.Model()
      super(options)

  class LinearAxis extends Axis.Model
    default_view: LinearAxisView
    type: 'LinearAxis'

    initialize: (attrs, options)->
      options.ticker = new tickers.BasicTicker()
      super(attrs, options)

    display_defaults: () ->
      super()

  class LinearAxes extends Backbone.Collection
     model: LinearAxis

  return {
    "Model": LinearAxis,
    "Collection": new LinearAxes(),
    "View": LinearAxisView
  }
