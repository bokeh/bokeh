import {Model} from "../../model"
import * as p from "core/properties"
import {intersection} from "core/util/array"
import {ColumnarDataSource} from "./columnar_data_source"

export class CDSView extends Model
  type: 'CDSView'

  initialize: (options) ->
    super(options)

    @compute_indices()

  @define {
     filters: [ p.Array, [] ]
     source:  [ p.Instance  ]
    }

  @internal {
      indices:     [ p.Array, [] ]
      indices_map: [ p.Any,   {} ]
    }

  compute_indices: () ->
    if @filters.length == 0
      if @source instanceof ColumnarDataSource
        @indices = @source?.get_indices()
    else
      indices = (filter.compute_indices(@source) for filter in @filters)
      @indices = intersection.apply(this, indices)

    @indices_map_to_subset()

  indices_map_to_subset: () ->
    @indices_map = {}
    for i in [0...@indices.length]
      @indices_map[@indices[i]] = i

  convert_selection: (selection) ->
    indices_1d = (@indices[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection

  subset_selection: (selection) ->
    indices_1d = (@indices_map[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection

  convert_indices: (indices) ->
    return (@indices[i] for i in indices)
