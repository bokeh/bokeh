import * as _ from "underscore"

p = require "../../core/properties"
Model = require "../../model"

class CustomJS extends Model
  type: 'CustomJS'

  @define {
      args: [ p.Any,     {}           ] # TODO (bev) better type
      code: [ p.String,  ''           ]
    }

  @getters {
    values: () -> @_make_values()
    func: () -> @_make_func()
  }

  execute: (cb_obj, cb_data) ->
    @func(@values..., cb_obj, cb_data, require)

  _make_values: () ->
    _.values(@args)

  _make_func: () ->
    # this relies on _.keys(args) and _.values(args) returning keys and values
    # in the same order
    new Function(_.keys(@args)..., "cb_obj", "cb_data", "require", @code)

module.exports =
  Model: CustomJS
