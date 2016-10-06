import * as _ from "underscore"

import * as Range from "./range"
import * as p from "../../core/properties"

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
      @_bounds_as_factors = @bounds
    else
      @_bounds_as_factors = @factors

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
    @_bounds_as_factors = @factors
    @_init()

  _init: () ->
    factors = @factors

    if @bounds? and @bounds != 'auto'
      factors = @_bounds_as_factors
      @factors = factors

    start = 0.5 + @offset
    end = factors.length + start

    @start = start
    @end = end

    if @bounds?
      @bounds = [start, end]

module.exports =
  Model: FactorRange
