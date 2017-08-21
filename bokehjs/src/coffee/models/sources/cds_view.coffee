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

  connect_signals: () ->
    super()
    @connect(@properties.filters.change, () ->
      @compute_indices()
      @change.emit()
    )
    if @source?.change?
      @connect(@source.change, () -> @compute_indices())
    if @source?.streaming?
      @connect(@source.streaming, () -> @compute_indices())
    if @source?.patching?
      @connect(@source.patching, () -> @compute_indices())

  compute_indices: () ->
    indices = (filter.compute_indices(@source) for filter in @filters)
    indices = (inds for inds in indices when inds?)
    if indices.length > 0
      @indices = intersection.apply(this, indices)
    else
      if @source instanceof ColumnarDataSource
        @indices = @source?.get_indices()

    @indices_map_to_subset()

  indices_map_to_subset: () ->
    @indices_map = {}
    for i in [0...@indices.length]
      @indices_map[@indices[i]] = i

  convert_selection_from_subset: (selection) ->
    indices_1d = (@indices[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection

  convert_selection_to_subset: (selection) ->
    indices_1d = (@indices_map[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection

  convert_indices_from_subset: (indices) ->
    return (@indices[i] for i in indices)
