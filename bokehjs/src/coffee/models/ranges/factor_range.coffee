import {Range} from "./range"
import * as p from "core/properties"

export class FactorRange extends Range
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
      @setv({_bounds_as_factors: @bounds}, {silent: true})
    else
      @setv({_bounds_as_factors: @factors}, {silent: true})

    @_init()
    @listenTo(@, 'change:factors', @_update_factors)
    @listenTo(@, 'change:offset', @_init)

  @getters {
    min: () -> @start
    max: () -> @end
  }

  reset: () ->
    @_init()
    @trigger('change')

  _update_factors: () ->
    # Factors have been changed, need to update the factored version of the bounds
    # @_bounds_as_factors = @factors
    @setv('_bounds_as_factors', @factors, {silent: true})
    @_init()

  _init: () ->
    factors = @factors

    if @bounds? and @bounds != 'auto'
      factors = @_bounds_as_factors
      @setv({factors: factors}, {silent: true})

    start = 0.5 + @offset
    end = factors.length + start
    @setv({start: start, end: end}, {silent: true})

    if @bounds?
      @setv({bounds: [start, end]}, {silent: true})
