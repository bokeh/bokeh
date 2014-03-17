
define [
  "backbone",
  "./axis",
  "range/factor_range"
  "ticking/categorical_tick_formatter"
  "ticking/tickers"
], (Backbone, Axis, FactorRange, CategoricalTickFormatter, tickers) ->

  class CategoricalAxisView extends Axis.View

    initialize: (attrs, options) ->
      super(attrs, options)
      @formatter = new CategoricalTickFormatter.Model()

  class CategoricalAxis extends Axis.Model
    default_view: CategoricalAxisView
    type: 'CategoricalAxis'

    initialize: (attrs, options)->
      options.ticker = new tickers.CategoricalTicker()
      super(attrs, options)

    _bounds: () ->
      i = @get('dimension')
      ranges = [@get_obj('plot').get_obj('x_range'), @get_obj('plot').get_obj('y_range')]

      user_bounds = @get('bounds') ? 'auto'
      if user_bounds != 'auto'
        console.log "Categorical Axes only support user_bounds='auto', ignoring"

      range_bounds = [ranges[i].get('min'), ranges[i].get('max')]

      return range_bounds

    display_defaults: () ->
      super()

  class CategoricalAxes extends Backbone.Collection
    model: CategoricalAxis
    type: 'CategoricalAxis'

  return {
      "Model": CategoricalAxis,
      "Collection": new CategoricalAxes(),
      "View": CategoricalAxisView
    }
