_ = require "underscore"

Range = require "./range"
p = require "../../core/properties"

class FactorRange extends Range.Model
  type: 'FactorRange'

  @define {
      offset:  [ p.Number, 0  ]
      factors: [ p.Array,  [] ]
      bounds:  [ p.Any        ] # TODO (bev)
      min_interval: [ p.Any ]
      max_interval: [ p.Any ]
    }

  @internal {
    _bounds_as_factors: [ p.Any ]
    start: [ p.Number ]
    end: [ p.Number ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)

    # Bounds come in as factors, but are later converted to
    # coordinates, so store the factored version for later use
    if @bounds? and @bounds != 'auto'
      @set('_bounds_as_factors', @bounds)
    else
      @set('_bounds_as_factors', @factors)

    @_init()

    @listenTo(@, 'change:factors', @_update_factors)
    @listenTo(@, 'change:offset', @_init)

  @getters {
    min: () -> @start
    max: () -> @end
  }

  reset: () ->
    @_init()

  _update_factors: () ->
    # Factors have been changed, need to update the factored version of the bounds
    @set('_bounds_as_factors', @factors)
    @_init()

  _init: () ->
    factors = @factors

    if @bounds? and @bounds != 'auto'
      factors = @_bounds_as_factors
      @set('factors', factors)

    start = 0.5 + @offset
    end = factors.length + start

    @set('start', start)
    @set('end', end)

    if @bounds?
      @set('bounds', [start, end])

module.exports =
  Model: FactorRange
