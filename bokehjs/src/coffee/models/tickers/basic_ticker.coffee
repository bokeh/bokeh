import * as _ from "underscore"

import * as AdaptiveTicker from "./adaptive_ticker"

class BasicTicker extends AdaptiveTicker.Model
  type: 'BasicTicker'

module.exports =
  Model: BasicTicker
