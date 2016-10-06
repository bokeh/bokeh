import * as _ from "underscore"

import * as ContinuousTicker from "./continuous_ticker"
import * as p from "../../core/properties"

# The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
# regardless of the input range.  It's not very useful by itself, but can
# be used as part of a CompositeTicker below.
class SingleIntervalTicker extends ContinuousTicker.Model
  type: 'SingleIntervalTicker'

  @define {
    interval: [ p.Number ]
  }

  @getters {
    min_interval: () -> @interval
    max_interval: () -> @interval
  }

  get_interval: (data_low, data_high, n_desired_ticks) -> @interval

module.exports =
  Model: SingleIntervalTicker
