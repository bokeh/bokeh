_ = require "underscore"
HasProperties = require "../common/has_properties"

class Callback extends HasProperties
  type: 'Callback'

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('values', @_make_values, true)
    @add_dependencies('values', @, ['args'])

    @register_property('func', @_make_func, true)
    @add_dependencies('func', @, ['args', 'code'])

  execute: (value) ->
    @get('func')(@get('values')..., value)

  _make_values: () ->
    _.map(_.values(@get("args")), @resolve_ref)

  _make_func: () ->
    new Function(_.keys(@get("args"))..., "value", @get("code"))

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      code: ""
    }

module.exports =
  Model: Callback