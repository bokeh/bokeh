import {Expression} from "./expression"
import * as p from "core/properties"

export class Stack extends Expression
  @define {
    fields: [ p.Array, [] ]
  }

  v_compute: (source) ->
    result = new Float64Array(source.get_length())
    for f in @fields
      for x, i in source.data[f]
        result[i] += x
    return result
