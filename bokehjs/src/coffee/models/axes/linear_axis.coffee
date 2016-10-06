import * as _ from "underscore"

import * as Axis from "./axis"
import * as ContinuousAxis from "./continuous_axis"
import * as BasicTickFormatter from "../formatters/basic_tick_formatter"
import * as BasicTicker from "../tickers/basic_ticker"

class LinearAxisView extends Axis.View

class LinearAxis extends ContinuousAxis.Model
  default_view: LinearAxisView

  type: 'LinearAxis'

  @override {
    ticker:    () -> new BasicTicker.Model()
    formatter: () -> new BasicTickFormatter.Model()
  }

export {
  LinearAxis as Model
  LinearAxisView as View
}
