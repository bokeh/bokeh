_ = require "underscore"
AbstractTicker = require "./abstract_ticker"

class FixedTicker extends AbstractTicker.Model
  type: 'FixedTicker'

  get_ticks_no_defaults: (data_low, data_high, desired_n_ticks) ->
    return {
      major: @get('ticks')
      minor: []
    }

  defaults: () ->
    return _.extend {}, super(), {
      ticks: []
    }

module.exports =
  Model: FixedTicker