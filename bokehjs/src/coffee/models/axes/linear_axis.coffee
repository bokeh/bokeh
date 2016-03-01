_ = require "underscore"

Axis = require "./axis"
ContinuousAxis = require "./continuous_axis"
BasicTickFormatter = require "../formatters/basic_tick_formatter"
BasicTicker = require "../tickers/basic_ticker"

class LinearAxisView extends Axis.View

class LinearAxis extends ContinuousAxis.Model
  default_view: LinearAxisView

  type: 'LinearAxis'

  defaults: ->
    return _.extend {}, super(), {
      # overrides
      ticker: new BasicTicker.Model()
      formatter: new BasicTickFormatter.Model()

      # internal
    }

module.exports =
  Model: LinearAxis
  View: LinearAxisView
