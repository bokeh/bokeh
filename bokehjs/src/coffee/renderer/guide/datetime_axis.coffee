_ = require "underscore"
LinearAxis = require "./axis"
DatetimeTicker = require "../../ticking/datetime_ticker"
DatetimeTickFormatter = require "../../ticking/datetime_tick_formatter"

class DatetimeAxisView extends LinearAxis.View

class DatetimeAxis extends LinearAxis.Model
  default_view: DatetimeAxisView
  type: 'DatetimeAxis'

  defaults: ->
    return _.extend {}, super(), {
      axis_label: "date"
      ticker: new DatetimeTicker.Model()
      formatter: new DatetimeTickFormatter.Model()
    }

module.exports =
  Model: DatetimeAxis
  View: DatetimeAxisView
