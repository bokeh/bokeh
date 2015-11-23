_ = require "underscore"
HasProperties = require "../common/has_properties"

class FactorRange extends HasProperties
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

  _init: () ->
    factors = @get('factors')
    start = 0.5 + @get('offset')

    @set('start', start)
    @set('end', factors.length + start)

    if @get('bound_lower')?
      converted_bound_lower = factors.indexOf(@get('bound_lower')) + 1 - start
      @set('bound_lower', converted_bound_lower)
    if @get('bound_upper')?
      converted_bound_upper = factors.indexOf(@get('bound_upper')) + 1 + start
      @set('bound_upper', converted_bound_upper)

  defaults: ->
    return _.extend {}, super(), {
      offset: 0
      factors: []
      bound_lower: null
      bound_upper: null
    }

module.exports =
  Model: FactorRange
