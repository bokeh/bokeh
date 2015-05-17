_ = require "underscore"
AdaptiveTicker = require "./adaptive_ticker"

class BasicTicker extends AdaptiveTicker.Model
  type: 'BasicTicker'

  defaults: () ->
    return _.extend {}, super(), {
      mantissas: [1,2,5]
    }

module.exports =
  Model: BasicTicker

