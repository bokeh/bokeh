import {ColumnarDataSource} from "./columnar_data_source"
import {HasProps} from "core/has_props"
import * as p from "core/properties"
import {Set} from "core/util/data_structures"
import * as serialization from "core/util/serialization"
import {isArray, isNumber, isObject} from "core/util/types"

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
export slice = (ind, length) ->
  if isObject(ind)
    return [ind.start ? 0, ind.stop ? length, ind.step ? 1]
  return [start, stop, step] = [ind, ind+1, 1]

# exported for testing
export patch_to_column = (col, patch, shapes) ->
  patched = new Set()
  patched_range = false

  for [ind, value] in patch

    # make the single index case look like the length-3 multi-index case
    if not isArray(ind)

      if isNumber(ind)
        value = [value]
        patched.push(ind)
      else
        patched_range = true

      ind = [0, 0, ind]
      shape = [1, col.length]
      item = col

    else
      patched.push(ind[0])
      shape = shapes[ind[0]]
      item = col[ind[0]]

    # this is basically like NumPy's "newaxis", inserting an empty dimension
    # makes length 2 and 3 multi-index cases uniform, so that the same code
    # can handle both
    if ind.length == 2
      shape = [1, shape[0]]
      ind = [ind[0], 0, ind[1]]

    # now this one nested loop handles all cases
    flat_index = 0
    [istart, istop, istep] = slice(ind[1], shape[0])
    [jstart, jstop, jstep] = slice(ind[2], shape[1])

    for i in [istart...istop] by istep
      for j in [jstart...jstop] by jstep
        if patched_range
          patched.push(j)
        item[i*shape[1] + j] = value[flat_index]
        flat_index++

  return patched

# Data source where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
export class ColumnDataSource extends ColumnarDataSource
  type: 'ColumnDataSource'

  initialize: (options) ->
    super(options)
    [@data, @_shapes] = serialization.decode_column_data(@data)

  @define {
    data:         [ p.Any,   {} ]
  }

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
    @streaming.emit()

  patch: (patches) ->
    data = @data
    patched = new Set()
    for k, patch of patches
      patched = patched.union(patch_to_column(data[k], patch, @_shapes[k]))
    @setv('data', data, {silent: true})
    @patching.emit(patched.values)
