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
    @set('start', 0.5 + @get('offset'))
    @set('end', @get('factors').length + @get('start'))

  defaults: ->
    return _.extend {}, super(), {
      offset: 0
      factors: []
    }

module.exports =
  Model: FactorRange