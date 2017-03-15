import {Transform} from "./transform"
import * as p from "core/properties"
import {values} from "core/util/object"

export class CustomJSTransform extends Transform
  type: 'CustomJSTransform'

  @define {
    args:         [ p.Any,          {}       ] # TODO (bev) better type
    code:         [ p.String      , ""       ]
  }

  @getters {
    func: () -> @_make_func()
    values: () -> @_make_values()
  }

  compute: (x) -> @func(@values..., require, x)

  v_compute: (xs) ->
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = @func(@values..., require, x)
    return result

  _make_func: () ->
    # this relies on Object.keys(args) and values(args) returning keys and values
    # in the same order
    new Function(Object.keys(@args)..., "require", "x", @code)

  _make_values: () -> values(@args)
