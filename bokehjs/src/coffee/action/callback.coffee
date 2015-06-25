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

  execute: (cb_obj, cb_data) ->
    @get('func')(@get('values')..., cb_obj, cb_data)

  _make_values: () ->
    _.map(_.values(@get("args")), @resolve_ref)

  _make_func: () ->
    new Function(_.keys(@get("args"))..., "cb_obj", "cb_data", @get("code"))

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      code: ""
    }

module.exports =
  Model: Callback
