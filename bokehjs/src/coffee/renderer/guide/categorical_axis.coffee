
define [
  "backbone",
  "./axis",
  "range/factor_range"
  "ticking/categorical_ticker"
  "ticking/categorical_tick_formatter"
], (Backbone, Axis, FactorRange, CategoricalTicker, CategoricalTickFormatter) ->

  class CategoricalAxisView extends Axis.View

  class CategoricalAxis extends Axis.Model
    default_view: CategoricalAxisView
    type: 'CategoricalAxis'

    initialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get_obj('ticker')?
        @set_obj('ticker', CategoricalTicker.Collection.create())
      if not @get_obj('formatter')?
        @set_obj('formatter', CategoricalTickFormatter.Collection.create())

    _bounds: () ->
      i = @get('dimension')
      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]

      user_bounds = @get('bounds') ? 'auto'
      if user_bounds != 'auto'
        console.log "Categorical Axes only support user_bounds='auto', ignoring"

      range_bounds = [ranges[i].get('min'), ranges[i].get('max')]

      return range_bounds

  class CategoricalAxes extends Backbone.Collection
    model: CategoricalAxis

  return {
      "Model": CategoricalAxis,
      "Collection": new CategoricalAxes(),
      "View": CategoricalAxisView
    }
