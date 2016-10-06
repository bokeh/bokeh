import * as _ from "underscore"

AdaptiveTicker = require "./adaptive_ticker"

class BasicTicker extends AdaptiveTicker.Model
  type: 'BasicTicker'

module.exports =
  Model: BasicTicker
