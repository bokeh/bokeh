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
    if @get('bounds')? and @get('bounds') != 'auto'
      @set('_bounds_as_factors', @get('bounds'))
    else
      @set('_bounds_as_factors', @get('factors'))

    @_init()

    @define_computed_property('min',
        () -> @get('start')
      , false)
    @add_dependencies('min', this, ['factors', 'offset'])
    @define_computed_property('max',
        () -> @get('end')
      , false)
    @add_dependencies('max', this, ['factors', 'offset'])

    @listenTo(@, 'change:factors', @_update_factors)
    @listenTo(@, 'change:offset', @_init)

  reset: () ->
    @_init()

  _update_factors: () ->
    # Factors have been changed, need to update the factored version of the bounds
    @set('_bounds_as_factors', @get('factors'))
    @_init()

  _init: () ->
    factors = @get('factors')

    if @get('bounds')? and @get('bounds') != 'auto'
      factors = @get('_bounds_as_factors')
      @set('factors', factors)

    start = 0.5 + @get('offset')
    end = factors.length + start

    @set('start', start)
    @set('end', end)

    if @get('bounds')?
      @set('bounds', [start, end])

module.exports =
  Model: FactorRange
