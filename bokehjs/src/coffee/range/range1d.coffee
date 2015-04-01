_ = require "underscore"
HasProperties = require "../common/has_properties"

class Range1d extends HasProperties
  type: 'Range1d'
  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('min',
        () -> Math.min(@get('start'), @get('end'))
      , true)
    @add_dependencies('min', this, ['start', 'end'])
    @register_property('max',
        () ->
          Math.max(@get('start'), @get('end'))
      , true)
    @add_dependencies('max', this, ['start', 'end'])

  defaults: ->
    return _.extend {}, super(), {
      start: 0
      end: 1
    }

module.exports =
  Model: Range1d