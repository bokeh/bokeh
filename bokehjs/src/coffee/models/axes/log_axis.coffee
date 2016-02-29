_ = require "underscore"

Axis = require "./axis"
ContinuousAxis = require "./continuous_axis"
LogTickFormatter = require "../formatters/log_tick_formatter"
LogTicker = require "../tickers/log_ticker"

class LogAxisView extends Axis.View

class LogAxis extends ContinuousAxis.Model
  default_view: LogAxisView

  type: 'LogAxis'

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      ticker: new LogTicker.Model()
      formatter: new LogTickFormatter.Model()

      # internal
    }

module.exports =
  Model: LogAxis
  View: LogAxisView
