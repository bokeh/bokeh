_ = require "underscore"
HasProperties = require "../common/has_properties"

class Callback extends HasProperties
  type: 'Callback'

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('values',
        () => _.map(_.values(@get("args")), (k) => @resolve_ref(k))
      , true)
    @add_dependencies('values', @, ['args'])

    @register_property('func',
        () => new Function(_.keys(@get("args"))..., "value", @get("body"))
      , true)
    @add_dependencies('func', @, ['args', 'body'])

  execute: (value) ->
    @get('func')(@get('values')..., value)

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      body: ""
    }

module.exports =
  Model: Callback