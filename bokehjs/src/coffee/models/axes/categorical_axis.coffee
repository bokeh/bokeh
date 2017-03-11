import {Axis, AxisView} from "./axis"
import {CategoricalTickFormatter} from "../formatters/categorical_tick_formatter"
import {CategoricalTicker} from "../tickers/categorical_ticker"
import {logger} from "core/logging"

export class CategoricalAxisView extends AxisView

export class CategoricalAxis extends Axis
  default_view: CategoricalAxisView

  type: 'CategoricalAxis'

  @override {
    ticker:    () -> new CategoricalTicker()
    formatter: () -> new CategoricalTickFormatter()
  }

  _computed_bounds: () ->
    [range, cross_range] = @ranges

    user_bounds = @bounds ? 'auto'
    range_bounds = [range.min, range.max]

    if user_bounds != 'auto'
      logger.warn("Categorical Axes only support user_bounds='auto', ignoring")

    return range_bounds
