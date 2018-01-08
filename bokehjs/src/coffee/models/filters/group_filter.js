import {Filter} from "./filter"
import * as p from "core/properties"
import {logger} from "core/logging"

export class GroupFilter extends Filter
  type: 'GroupFilter'

  @define {
    column_name:  [ p.String  ]
    group:        [ p.String  ]
  }

  compute_indices: (source) ->
    column = source.get_column(@column_name)
    if !column?
      logger.warn("group filter: groupby column not found in data source")
      return null
    else
      @indices = (i for i in [0...source.get_length()] when column[i] == @group)
      if @indices.length == 0
        logger.warn("group filter: group '#{@group}' did not match any values in column '#{@column_name}'")
      return @indices
