
define [
  "backbone",
  "./axis",
  "ticking/datetime_tick_formatter",
  "ticking/tickers"
], (Backbone, Axis, DatetimeTickFormatter, tickers) ->

  class DatetimeAxisView extends Axis.View

  class DatetimeAxis extends Axis.Model
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    defaults: () ->
      return {
        ticker: new tickers.DatetimeTicker()
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
