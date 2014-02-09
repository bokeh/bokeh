
define [
  "backbone",
  "./linear_axis",
  "common/ticking",
  "range/factor_range"
], (Backbone, LinearAxis, ticking, FactorRange) ->

  class _CategoricalFormatter
    format: (ticks) ->
      return ticks

  class _CategoricalScale
    get_ticks: (start, end, range, {desired_n_ticks}) ->
      return range.get("values")

  class CategoricalAxisView extends LinearAxis.View

    initialize: (attrs, options) ->
      super(attrs, options)
      @formatter = new _CategoricalFormatter()

  class CategoricalAxis extends Backbone.Model
    default_view: CategoricalAxisView
    type: 'CategoricalAxis'

    initialize: (attrs, options)->
      options.scale = new _CategoricalScale()
      super(attrs, options)

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
    type: 'CategoricalAxis'

    display_defaults: () ->
      super()

  return {
      "Model": CategoricalAxis,
      "Collection": new CategoricalAxes(),
      "View": CategoricalAxisView
    }
