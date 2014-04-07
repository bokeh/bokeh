
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

    dinitialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get_obj('ticker')?
        @set_obj('ticker', BasicTicker.Collection.create({doc: @get('doc')}))
      if not @get_obj('formatter')?
        @set_obj('formatter', BasicTickFormatter.Collection.create({doc: @get('doc')}))

  class LinearAxes extends Backbone.Collection
     model: LinearAxis

  return {
    "Model": LinearAxis,
    "Collection": new LinearAxes(),
    "View": LinearAxisView
  }
