import {Model} from "../../model"
import * as p from "core/properties"
import {isBoolean} from "core/util/types"
import {range} from "core/util/array"

export class Filter extends Model
  type: 'Filter'

  initialize: (options) ->
    super(options)

  @define {
    filter:      [p.Any,   [] ]
  }

  compute_indices: () ->
    if @filter?.length? > 0 && isBoolean(@filter[0])
      return (i for i in range(0, @filter.length) when @filter[i] == true)
    else
      return @filter
