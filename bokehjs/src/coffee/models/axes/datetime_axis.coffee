import * as _ from "underscore"

import * as LinearAxis from "./axis"
import * as DatetimeTickFormatter from "../formatters/datetime_tick_formatter"
import * as DatetimeTicker from "../tickers/datetime_ticker"

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
