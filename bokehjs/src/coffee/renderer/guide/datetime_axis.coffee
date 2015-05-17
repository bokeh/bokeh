Collections = require("../../common/base").Collections
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
      @set_obj('ticker', Collections('DatetimeTicker').create())
    if not @get('formatter')?
      @set_obj('formatter', Collections('DatetimeTickFormatter').create())

module.exports =
  Model: DatetimeAxis
  View: DatetimeAxisView
