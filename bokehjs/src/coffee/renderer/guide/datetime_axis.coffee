
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

    dinitialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get_obj('ticker')?
        @set_obj('ticker', new DatetimeTicker.Model())
      if not @get_obj('formatter')?
        @set_obj('formatter', new DatetimeTickFormatter.Model())

  class DatetimeAxes extends Backbone.Collection
    model: DatetimeAxis

  return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    }
