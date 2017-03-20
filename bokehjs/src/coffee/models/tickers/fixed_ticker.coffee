import {ContinuousTicker} from "./continuous_ticker"
import * as p from "core/properties"

export class FixedTicker extends ContinuousTicker
  type: 'FixedTicker'

  @define {
      ticks: [ p.Array, [] ]
    }

  get_ticks_no_defaults: (data_low, data_high, cross_loc, desired_n_ticks) ->
    return {
      major: @ticks
      minor: []
    }
