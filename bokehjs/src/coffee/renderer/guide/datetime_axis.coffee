
define [
  "common/collection",
  "./axis",
  "ticking/datetime_ticker"
  "ticking/datetime_tick_formatter",
], (Collection, Axis, DatetimeTicker, DatetimeTickFormatter) ->

  class DatetimeAxisView extends Axis.View

  class DatetimeAxis extends Axis.Model
    default_view: DatetimeAxisView
    type: 'DatetimeAxis'

    initialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get('ticker')?
        @set_obj('ticker', DatetimeTicker.Collection.create())
      if not @get('formatter')?
        @set_obj('formatter', DatetimeTickFormatter.Collection.create())

  class DatetimeAxes extends Collection
    model: DatetimeAxis

  return {
      "Model": DatetimeAxis,
      "Collection": new DatetimeAxes(),
      "View": DatetimeAxisView
    }
