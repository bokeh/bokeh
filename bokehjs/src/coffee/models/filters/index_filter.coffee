import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {isInteger} from "core/util/types"
import {all} from "core/util/array"

export class IndexFilter extends Filter
  type: 'IndexFilter'

  @define {
    indices:    [ p.Array,  null ]
  }

  compute_indices: (source) ->
    if @indices?.length >= 0
      if all(@indices, isInteger)
        return @indices
      else
        logger.warn("IndexFilter #{@id}: indices should be array of integers, defaulting to no filtering")
        return null
    else
      logger.warn("IndexFilter #{@id}: indices was not set, defaulting to no filtering")
      return null
