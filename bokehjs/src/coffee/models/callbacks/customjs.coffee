import * as p from "core/properties"
import {values} from "core/util/object"
import {Model} from "../../model"

export class CustomJS extends Model
  type: 'CustomJS'

  @define {
    args: [ p.Any,     {} ] # TODO (bev) better type
    code: [ p.String,  '' ]
  }

  @getters {
    values: () -> @_make_values()
    func: () -> @_make_func()
  }

  execute: (cb_obj, cb_data) ->
    @func.apply(cb_obj, @values.concat(cb_obj, cb_data, require, {}))

  _make_values: () -> values(@args)

  _make_func: () ->
    # this relies on Object.keys(args) and values(args) returning keys and values
    # in the same order
    new Function(Object.keys(@args)..., "cb_obj", "cb_data", "require", "exports", @code)
