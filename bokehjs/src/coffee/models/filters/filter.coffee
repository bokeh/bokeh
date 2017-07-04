import {Model} from "../../model"
import * as p from "core/properties"
import {isBoolean, isInteger} from "core/util/types"
import {all, range} from "core/util/array"
import {logger} from "core/logging"

export class Filter extends Model
  type: 'Filter'

  initialize: (options) ->
    super(options)

  @define {
    filter:      [p.Array,   null ]
  }

  compute_indices: () ->
    if @filter?.length >= 0
      if all(@filter, isBoolean)
        return (i for i in range(0, @filter.length) when @filter[i] == true)
      else if all(@filter, isInteger)
        return @filter
      else
        logger.warn("Filter #{@id}: filter should either be array of only booleans or only integers, defaulting to no filtering")
        return null
    else
      logger.warn("Filter #{@id}: filter was not set to be an array, defaulting to no filtering")
      return null
