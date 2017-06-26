import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"
import {range, all} from "core/util/array"
import {isBoolean} from "core/util/types"

export class BooleanFilter extends Filter
  type: 'BooleanFilter'

  @define {
    booleans:    [ p.Array,  null ]
  }

  compute_indices: (source) ->
    if @booleans?.length > 0
      if all(@booleans, isBoolean)
        if @booleans.length != source.get_length()
          logger.warn("BooleanFilter #{@id}: length of booleans doesn't match data source")
        return (i for i in range(0, @booleans.length) when @booleans[i] == true)
      else
        logger.warn("BooleanFilter #{@id}: booleans should be array of booleans, defaulting to no filtering")
        return null
    else
      if @booleans?.length == 0
        logger.warn("BooleanFilter #{@id}: booleans is empty, defaulting to no filtering")
      else
        logger.warn("BooleanFilter #{@id}: booleans was not set, defaulting to no filtering")
      return null
