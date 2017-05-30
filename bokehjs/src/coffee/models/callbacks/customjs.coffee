import * as p from "core/properties"
import {values} from "core/util/object"
import {Model} from "../../model"

export class CustomJS extends Model
  type: 'CustomJS'

  connect_signals: () ->
    super()
    @connect(@change, () -> @_func = null)

  @define {
    args: [ p.Any,     {}           ] # TODO (bev) better type
    code: [ p.String,  ''           ]
  }

  @getters {
    values: () -> values(@args)
    func: () ->
      if not @_func?
        @_func = @_make_func()
      return @_func
  }

  _make_func: () ->
    # this relies on Object.keys(args) and values(args) returning keys and values
    # in the same order
    new Function(Object.keys(@args)..., "cb_obj", "cb_data", "vars", "require", "exports", @code)

  execute: (cb_obj, cb_data) ->
    vars = {
      get: (name) => return @document.get_var(name)
      set: (name, value) => @document.set_var(name, value)
    }

    @func(@values..., cb_obj, cb_data, vars, require, {})
