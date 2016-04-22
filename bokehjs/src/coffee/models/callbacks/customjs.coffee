_ = require "underscore"

p = require "../../core/properties"
Model = require "../../model"

class CustomJS extends Model
  type: 'CustomJS'

  @define {
      args: [ p.Any,     {}           ] # TODO (bev) better type
      code: [ p.String,  ''           ]
      lang: [ p.String , 'javascript' ] # TODO (bev) enum
    }

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('values', @_make_values, true)
    @add_dependencies('values', @, ['args'])

    @define_computed_property('func', @_make_func, true)
    @add_dependencies('func', @, ['args', 'code'])

  execute: (cb_obj, cb_data) ->
    @get('func')(@get('values')..., cb_obj, cb_data, require)

  _make_values: () ->
    _.values(@get("args"))

  _make_func: () ->
    code = @get("code")

    code = switch @get("lang")
      when "javascript"
        code
      when "coffeescript"
        coffee = require "coffee-script"
        coffee.compile(code, {bare: true, shiftLine: true})

    # this relies on _.keys(args) and _.values(args) returning keys and values
    # in the same order
    new Function(_.keys(@get("args"))..., "cb_obj", "cb_data", "require", code)

module.exports =
  Model: CustomJS
