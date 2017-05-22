import {Model} from "../../model"
import * as p from "core/properties"
import {isBoolean} from "core/util/types"
import {range} from "core/util/array"

export class Filter extends Model
  type: 'Filter'

  initialize: (options) ->
    super(options)

    @compute_indices()

  @define {
    filter:      [p.Any,   [] ]
  }

  @internal {
    indices:     [p.Array, [] ]
  }

  compute_indices: () ->
    if @filter?.length? > 0 && isBoolean(@filter[0])
      @indices = (i for i in range(0, @filter.length) when @filter[i] == true)
    else
      @indices = @filter

  get_indices: () ->
    return @indices
