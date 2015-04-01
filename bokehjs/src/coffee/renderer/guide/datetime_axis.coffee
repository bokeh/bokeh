Collection = require "../../common/collection"
DatetimeTicker = require "../../ticking/datetime_ticker"
DatetimeTickFormatter = require "../../ticking/datetime_tick_formatter"
Axis = require "./axis"

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

module.exports =
  Model: DatetimeAxis
  Collection: new DatetimeAxes()
  View: DatetimeAxisView
