
define [
  "underscore",
  "backbone",
  "./axis"
  "ticking/basic_ticker",
  "ticking/basic_tick_formatter",
], (_, Backbone, Axis, BasicTicker, BasicTickFormatter) ->

  class LinearAxisView extends Axis.View

  class LinearAxis extends Axis.Model
    default_view: LinearAxisView
    type: 'LinearAxis'

    defaults: () ->
      return {
        ticker: new BasicTicker.Model()
        formatter: new BasicTickFormatter.Model()
      }

    display_defaults: () ->
      super()

  class LinearAxes extends Backbone.Collection
     model: LinearAxis

  return {
    "Model": LinearAxis,
    "Collection": new LinearAxes(),
    "View": LinearAxisView
  }
