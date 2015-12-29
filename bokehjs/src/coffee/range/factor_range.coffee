_ = require "underscore"
Range = require "./range"

class FactorRange extends Range.Model
  type: 'FactorRange'

  initialize: (attrs, options) ->
    super(attrs, options)
    @_init()

    @register_property('min',
        () -> @get('start')
      , false)
    @add_dependencies('min', this, ['factors', 'offset'])
    @register_property('max',
        () -> @get('end')
      , false)
    @add_dependencies('max', this, ['factors', 'offset'])

    @listenTo(@, 'change:factors', @_init)
    @listenTo(@, 'change:offset', @_init)

  reset: () ->
    @_init()

  _init: () ->
    factors = @get('factors')
    start = 0.5 + @get('offset')

    @set('start', start)
    @set('end', factors.length + start)

  defaults: ->
    return _.extend {}, super(), {
      offset: 0
      factors: []
      bounds: null
    }

module.exports =
  Model: FactorRange
