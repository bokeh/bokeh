_ = require "underscore"

ContinuousTicker = require "./continuous_ticker"
p = require "../../core/properties"

class FixedTicker extends ContinuousTicker.Model
  type: 'FixedTicker'

  @define {
      ticks: [ p.Array, [] ]
    }

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    return {
      major: @get('ticks')
      minor: []
    }

module.exports =
  Model: FixedTicker
