
define [
  "backbone",
  "./axis",
  "ticking/datetime_ticker"
  "ticking/datetime_tick_formatter",
], (Backbone, Axis, DatetimeTicker, DatetimeTickFormatter) ->

  class DatetimeAxisView extends Axis.View

  class DatetimeAxis extends Axis.Model
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    defaults: () ->
      return {
        ticker: new DatetimeTicker.Model()
        formatter: new DatetimeTickFormatter.Model()
      }

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
