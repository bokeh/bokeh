import {Transform} from "./transform"
import * as p from "core/properties"
import {values} from "core/util/object"

export class CustomJSTransform extends Transform
  type: 'CustomJSTransform'

  @define {
    args:         [ p.Any,          {}       ] # TODO (bev) better type
    func:         [ p.String,       ""       ]
    v_func:       [ p.String,       ""       ]
  }

  @getters {
    values: () -> @_make_values()
    scalar_transform: () -> @_make_transform("x", @func)
    vector_transform: () -> @_make_transform("xs", @v_func)
  }

  compute: (x) -> @scalar_transform(@values..., x, require, exports)

  v_compute: (xs) -> @vector_transform(@values..., xs, require, exports)

  _make_transform: (val, fn) ->
    # this relies on Object.keys(args) and values(args) returning keys and values
    # in the same order
    new Function(Object.keys(@args)..., val, "require", "exports", fn)

  _make_values: () -> values(@args)
