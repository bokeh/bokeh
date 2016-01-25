_ = require "underscore"
LinearAxis = require "./axis"
DatetimeTicker = require "../tickers/datetime_ticker"
DatetimeTickFormatter = require "../formatters/datetime_tick_formatter"

class DatetimeAxisView extends LinearAxis.View

class DatetimeAxis extends LinearAxis.Model
  default_view: DatetimeAxisView
  type: 'DatetimeAxis'

  defaults: ->
    return _.extend {}, super(), {
      axis_label: ""
      ticker: new DatetimeTicker.Model()
      formatter: new DatetimeTickFormatter.Model()
    }

module.exports =
  Model: DatetimeAxis
  View: DatetimeAxisView
