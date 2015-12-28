_ = require "underscore"
Axis = require "./axis"
ContinuousAxis = require "./continuous_axis"
LogTicker = require "../../ticking/log_ticker"
LogTickFormatter = require "../../ticking/log_tick_formatter"

class LogAxisView extends Axis.View

class LogAxis extends ContinuousAxis.Model
  default_view: LogAxisView
  type: 'LogAxis'

  defaults: ->
    return _.extend {}, super(), {
      ticker: new LogTicker.Model()
      formatter: new LogTickFormatter.Model()
    }

module.exports =
  Model: LogAxis
  View: LogAxisView
