import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"

export class IndexFilter extends Filter
  type: 'IndexFilter'

  @define {
    indices:    [ p.Array, [] ]
  }

  compute_indices: (source) ->
    return @indices
