
define [
  "backbone",
  "./linear_axis",
  "common/ticking"
], (Backbone, LinearAxis, ticking) ->

  class DatetimeAxisView extends LinearAxis.View

    initialize: (attrs, options) ->
      super(attrs, options)
      @formatter = new ticking.DatetimeFormatter()

  class DatetimeAxis extends LinearAxis.Model
    default_view: DatetimeAxisView

    initialize: (attrs, options)->
      super(attrs, options)

  class DatetimeAxes extends Backbone.Collection
    model: DatetimeAxis
    type: 'DatetimeAxis'

  return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    }
