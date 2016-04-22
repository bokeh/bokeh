_ = require "underscore"

LinearAxis = require "./axis"
DatetimeTickFormatter = require "../formatters/datetime_tick_formatter"
DatetimeTicker = require "../tickers/datetime_ticker"

class DatetimeAxisView extends LinearAxis.View

class DatetimeAxis extends LinearAxis.Model
  default_view: DatetimeAxisView

  type: 'DatetimeAxis'

  @override {
    ticker:    () -> new DatetimeTicker.Model()
    formatter: () -> new DatetimeTickFormatter.Model()
  }

module.exports =
  Model: DatetimeAxis
  View: DatetimeAxisView
