_ = require "underscore"

ContinuousTicker = require "./continuous_ticker"
p = require "../../core/properties"

# The SingleIntervalTicker is a Ticker that always uses the same tick spacing,
# regardless of the input range.  It's not very useful by itself, but can
# be used as part of a CompositeTicker below.
class SingleIntervalTicker extends ContinuousTicker.Model
  type: 'SingleIntervalTicker'

  @define {
      interval: [ p.Number ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @define_computed_property('min_interval',
        () -> @get('interval')
      , true)
    @add_dependencies('min_interval', this, ['interval'])

    @define_computed_property('max_interval',
        () -> @get('interval')
      , true)
    @add_dependencies('max_interval', this, ['interval'])

  get_interval: (data_low, data_high, n_desired_ticks) ->
    return @get('interval')

module.exports =
  Model: SingleIntervalTicker
