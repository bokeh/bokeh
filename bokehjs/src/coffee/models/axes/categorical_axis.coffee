_ = require "underscore"

Axis = require "./axis"
CategoricalTickFormatter = require "../formatters/categorical_tick_formatter"
CategoricalTicker = require "../tickers/categorical_ticker"
{logger} = require "../../core/logging"

class CategoricalAxisView extends Axis.View

class CategoricalAxis extends Axis.Model
  default_view: CategoricalAxisView

  type: 'CategoricalAxis'

  @override {
    ticker:    () -> new CategoricalTicker.Model()
    formatter: () -> new CategoricalTickFormatter.Model()
  }

  _computed_bounds: () ->
    [range, cross_range] = @get('ranges')

    user_bounds = @get('bounds') ? 'auto'
    range_bounds = [range.get('min'), range.get('max')]

    if user_bounds != 'auto'
      logger.warn("Categorical Axes only support user_bounds='auto', ignoring")

    return range_bounds

module.exports =
  Model: CategoricalAxis
  View: CategoricalAxisView
