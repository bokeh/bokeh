import * as _ from "underscore"

import * as Axis from "./axis"
import * as CategoricalTickFormatter from "../formatters/categorical_tick_formatter"
import * as CategoricalTicker from "../tickers/categorical_ticker"
import {logger} from "../../core/logging"

class CategoricalAxisView extends Axis.View

class CategoricalAxis extends Axis.Model
  default_view: CategoricalAxisView

  type: 'CategoricalAxis'

  @override {
    ticker:    () -> new CategoricalTicker.Model()
    formatter: () -> new CategoricalTickFormatter.Model()
  }

  _computed_bounds: () ->
    [range, cross_range] = @ranges

    user_bounds = @bounds ? 'auto'
    range_bounds = [range.min, range.max]

    if user_bounds != 'auto'
      logger.warn("Categorical Axes only support user_bounds='auto', ignoring")

    return range_bounds

export {
  CategoricalAxis as Model
  CategoricalAxisView as View
}
