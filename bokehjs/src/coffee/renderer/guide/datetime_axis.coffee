
define [
  "backbone",
  "./axis",
  "ticking/datetime_tick_formatter",
  "ticking/tickers"
], (Backbone, Axis, DatetimeTickFormatter, tickers) ->

  class DatetimeAxisView extends Axis.View

    initialize: (options) ->
      options.formatter = new DatetimeTickFormatter.Model()
      super(options)

  class DatetimeAxis extends Axis.Model
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    initialize: (attrs, options) ->
      options.ticker = new tickers.DatetimeTicker()
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
