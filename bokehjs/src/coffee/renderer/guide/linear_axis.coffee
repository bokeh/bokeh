
define [
  "underscore",
  "common/collection",
  "./axis"
  "ticking/basic_ticker",
  "ticking/basic_tick_formatter",
], (_, Collection, Axis, BasicTicker, BasicTickFormatter) ->

  class LinearAxisView extends Axis.View

  class LinearAxis extends Axis.Model
    default_view: LinearAxisView
    type: 'LinearAxis'

    initialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get('ticker')?
        @set_obj('ticker', BasicTicker.Collection.create())
      if not @get('formatter')?
        @set_obj('formatter', BasicTickFormatter.Collection.create())

  class LinearAxes extends Collection
     model: LinearAxis

  return {
    "Model": LinearAxis,
    "Collection": new LinearAxes(),
    "View": LinearAxisView
  }
