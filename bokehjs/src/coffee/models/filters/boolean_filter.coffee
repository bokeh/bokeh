import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {range} from "core/util/array"

export class BooleanFilter extends Filter
  type: 'BooleanFilter'

  @define {
    booleans:    [ p.Array, [] ]
  }

  compute_indices: (source) ->
    return (i for i in range(0, @booleans.length) when @booleans[i] == true)
