_ = require "underscore"
HasProperties = require "../common/has_properties"

class FactorRange extends HasProperties
  type: 'FactorRange'
  initialize: (attrs, options) ->
    super(attrs, options)
    @set('end', @get('factors').length + 0.5)
    @register_property('min',
        () -> @get('start')
      , false)
    @add_dependencies('min', this, ['factors'])
    @register_property('max',
        () -> @get('end')
      , false)
    @add_dependencies('max', this, ['factors'])
    @listenTo(@, 'change:factors', () ->
      @set('end', @get('factors').length + 0.5)
    )

  defaults: ->
    return _.extend {}, super(), {
      start: 0.5
      factors: []
    }

module.exports =
  Model: FactorRange