import {ColumnarDataSource} from "./columnar_data_source"
import {HasProps} from "../../core/has_props"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"
import * as serialization from "../../core/util/serialization"
import {isObject, isBoolean} from "../../core/util/types"
import * as hittest from "../../core/hittest"
import {range, intersection} from "../../core/util/array"

# exported for testing
export concat_typed_arrays = (a, b) ->
  c = new (a.constructor)(a.length + b.length)
  c.set(a, 0)
  c.set(b, a.length)
  return c

#exported for testing
export stream_to_column = (col, new_col, rollover) ->
  # handle regular (non-typed) arrays
  if col.concat?
    col = col.concat(new_col)
    if col.length > rollover
      col = col.slice(-rollover)
    return col

  total_len = col.length + new_col.length

  # handle rollover case for typed arrays
  if rollover? and total_len > rollover

    start = total_len - rollover
    end = col.length

    # resize col if it is shorter than the rollover length
    if col.length < rollover
      tmp = new (col.constructor)(rollover)
      tmp.set(col, 0)
      col = tmp

    # shift values in original col to accommodate new_col
    for i in [start...end]
      col[i-start] = col[i]

    # update end values in col with new_col
    for i in [0...new_col.length]
      col[i+(end-start)] = new_col[i]

    return col

  # handle non-rollover case for typed arrays
  tmp = new col.constructor(new_col)
  return concat_typed_arrays(col, tmp)

# exported for testing
export patch_to_column = (col, patch) ->
  for i in [0...patch.length]
    [ind, value] = patch[i]
    col[ind] = value


# Datasource where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
export class ColumnDataSource extends ColumnarDataSource
  type: 'ColumnDataSource'

  initialize: (options) ->
    super(options)

    @compute_indices()
    @subset_data()
    @indices_map_to_subset()

    @listenTo @, 'change:filter', @compute_indices
    @listenTo @, 'change:group', @compute_indices
    @listenTo @, 'change:indices', @subset_data
    @listenTo @data_store, 'change:selected', () ->
      @synchronize_selection(@data_store.selected)

  @define {
    data_store:   [ p.Any,   {} ]
    filter:       [ p.Array, [] ]
    group:        [ p.Array, [] ]
  }

  @internal {
    indices:      [p.Array,  [] ]
    indices_map:  [p.Any,    {} ]
    data:         [p.Any,    {} ]
  }

  compute_indices: () ->
    filter_indices = @_get_filter_indices()
    group_indices = @_get_group_indices()
    @indices = intersection(filter_indices, group_indices)

  _get_filter_indices: () ->
    if @filter.length == 0
      filter_indices = range(0, @data_store.get_length())
    else if isBoolean(@filter[0])
      filter_indices = (i for i in range(0, @data_store.get_length()) when @filter[i] == true)
    else
      filter_indices = @filter
    return filter_indices

  _get_group_indices: () ->
    if @group.length == 0
      group_indices = range(0, @data_store.get_length())
    else if @group.length == 2
      if @group[0] of @data_store.data
        group_indices = (i for i in range(0, @data_store.get_length()) when @data_store.data[@group[0]][i] == @group[1])
    return group_indices

  subset_data: () ->
    @data = {}
    for col_name, col_data of @data_store.data
      @data[col_name] = (col_data[i] for i in @indices)

  indices_map_to_subset: () ->
    @indices_map = {}
    for i in [0...@indices.length]
      @indices_map[@indices[i]] = i

  synchronize_selection: (selection) ->
    selected = hittest.create_hit_test_result()
    indices_1d = selection['1d']['indices']
    subset_indices_1d = (@indices_map[i] for i in indices_1d when i of @indices_map)
    selected['1d']['indices'] = subset_indices_1d
    @selected = selected

  convert_selection_to_data_store: (selection) ->
    indices_1d = (@indices[i] for i in selection['1d']['indices'])
    selection['1d']['indices'] = indices_1d
    return selection

  attributes_as_json: (include_defaults=true, value_to_json=ColumnDataSource._value_to_json) ->
    attrs = {}
    for own key, value of @serializable_attributes()
      if key == 'data'
        value = serialization.encode_column_data(value, @_shapes)
      if include_defaults
        attrs[key] = value
      else if key of @_set_after_defaults
        attrs[key] = value
    value_to_json("attributes", attrs, @)

  @_value_to_json: (key, value, optional_parent_object) ->
    if isObject(value) and key == 'data'
      serialization.encode_column_data(value, optional_parent_object._shapes)
    else
      HasProps._value_to_json(key, value, optional_parent_object)

  stream: (new_data, rollover) ->
    data = @data
    for k, v of new_data
      data[k] = stream_to_column(data[k], new_data[k], rollover)
    @setv('data', data, {silent: true})
    @trigger('stream')

  patch: (patches) ->
    data = @data
    for k, patch of patches
      patch_to_column(data[k], patch)
    @setv('data', data, {silent: true})
    @trigger('patch')
