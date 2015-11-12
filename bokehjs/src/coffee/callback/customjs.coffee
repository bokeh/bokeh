_ = require "underscore"
coffee = require "coffee-script"
HasProperties = require "../common/has_properties"

class CustomJS extends HasProperties
  type: 'CustomJS'

  initialize: (attrs, options) ->
    super(attrs, options)

    @register_property('values', @_make_values, true)
    @add_dependencies('values', @, ['args'])

    @register_property('func', @_make_func, true)
    @add_dependencies('func', @, ['args', 'code'])

  execute: (cb_obj, cb_data) ->
    @get('func')(@get('values')..., cb_obj, cb_data, require)

  _make_values: () ->
    _.values(@get("args"))

  _make_func: () ->
    code = @get("code")

    code = switch @get("lang")
      when "javascript"   then code
      when "coffeescript" then coffee.compile(code, {bare: true, shiftLine: true})

    # this relies on _.keys(args) and _.values(args) returning keys and values
    # in the same order
    new Function(_.keys(@get("args"))..., "cb_obj", "cb_data", "require", code)

  defaults: ->
    return _.extend {}, super(), {
      args: {}
      code: ""
      lang: "javascript"
    }

module.exports =
  Model: CustomJS
