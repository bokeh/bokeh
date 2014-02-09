
define [
  "backbone",
  "./axis",
  "common/ticking"
], (Backbone, Axis, ticking) ->

  class DatetimeAxisView extends Axis.View

    initialize: (options) ->
      options.formatter = new ticking.DatetimeFormatter()
      super(options)

  class DatetimeAxis extends Axis.Model
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    initialize: (attrs, options) ->
      options.scale = new ticking.DatetimeScale()
      super(attrs, options)

    display_defaults: () ->
      super()

  class DatetimeAxes extends Backbone.Collection
    model: DatetimeAxis
    type: 'DatetimeAxis'

  return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    }
