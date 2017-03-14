import {Transform} from "./transform"
import * as p from "core/properties"

export class CustomJSTransform extends Transform
  type: 'CustomJSTransform'

  @define {
    code:         [ p.String      , ""       ]
  }

  @getters {
    func: () -> @_make_func()
  }

  compute: (x) ->
    return @func(x)

  v_compute: (xs) ->
    result = new Float64Array(xs.length)
    for x, idx in xs
      result[idx] = @func(x)
    return result

  _make_func: () ->
    return new Function("x", @code)
