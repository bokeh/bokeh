_ = require "underscore"
Collection = require "../common/collection"
AdaptiveTicker = require "./adaptive_ticker"

class BasicTicker extends AdaptiveTicker.Model
  type: 'BasicTicker'

  defaults: () ->
    return _.extend {}, super(), {
      mantissas: [1,2,5]
    }

class BasicTickers extends Collection
  model: BasicTicker

module.exports =
  Model: BasicTicker
  Collection: new BasicTickers()

