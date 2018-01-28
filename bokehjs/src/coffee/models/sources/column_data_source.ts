/* XXX: partial */
import {ColumnarDataSource} from "./columnar_data_source"
import {HasProps} from "core/has_props"
import * as p from "core/properties"
import {Set} from "core/util/data_structures"
import * as serialization from "core/util/serialization"
import {isArray, isNumber, isObject} from "core/util/types"

// exported for testing
export const concat_typed_arrays = function(a, b) {
  const c = new (a.constructor)(a.length + b.length)
  c.set(a, 0)
  c.set(b, a.length)
  return c
}

//exported for testing
export const stream_to_column = function(col, new_col, rollover) {
  // handle regular (non-typed) arrays
  let tmp
  if (col.concat != null) {
    col = col.concat(new_col)
    if (col.length > rollover) {
      col = col.slice(-rollover)
    }
    return col
  }

  const total_len = col.length + new_col.length

  // handle rollover case for typed arrays
  if ((rollover != null) && (total_len > rollover)) {
    const start = total_len - rollover
    const end = col.length

    // resize col if it is shorter than the rollover length
    if (col.length < rollover) {
      tmp = new (col.constructor)(rollover)
      tmp.set(col, 0)
      col = tmp
    }

    // shift values in original col to accommodate new_col
    for (let i = start, endi = end; i < endi; i++) {
      col[i-start] = col[i]
    }

    // update end values in col with new_col
    for (let i = 0, endi = new_col.length; i < endi; i++) {
      col[i+(end-start)] = new_col[i]
    }

    return col
  }

  // handle non-rollover case for typed arrays
  tmp = new col.constructor(new_col)
  return concat_typed_arrays(col, tmp)
}

// exported for testing
export const slice = function(ind, length) {
  let ref, start, step, stop
  if (isObject(ind)) {
    return [ind.start != null ? ind.start : 0, ind.stop != null ? ind.stop : length, ind.step != null ? ind.step : 1]
  }
  return [start, stop, step] = ref = [ind, ind+1, 1], ref
}

// exported for testing
export const patch_to_column = function(col, patch, shapes) {
  const patched = new Set()
  let patched_range = false

  for (let [ind, value] of patch) {

    // make the single index case look like the length-3 multi-index case
    let  item, shape
    if (!isArray(ind)) {
      if (isNumber(ind)) {
        value = [value]
        patched.push(ind)
      } else {
        patched_range = true
      }

      ind = [0, 0, ind]
      shape = [1, col.length]
      item = col

    } else {
      patched.push(ind[0])
      shape = shapes[ind[0]]
      item = col[ind[0]]
    }

    // this is basically like NumPy's "newaxis", inserting an empty dimension
    // makes length 2 and 3 multi-index cases uniform, so that the same code
    // can handle both
    if (ind.length === 2) {
      shape = [1, shape[0]]
      ind = [ind[0], 0, ind[1]]
    }

    // now this one nested loop handles all cases
    let flat_index = 0
    const [istart, istop, istep] = slice(ind[1], shape[0])
    const [jstart, jstop, jstep] = slice(ind[2], shape[1])

    for (let i = istart; i < istop; i += istep) {
      for (let j = jstart; j < jstop; j += jstep) {
        if (patched_range) {
          patched.push(j)
        }
        item[(i*shape[1]) + j] = value[flat_index]
        flat_index++
      }
    }
  }

  return patched
}

// Data source where the data is defined column-wise, i.e. each key in the
// the data attribute is a column name, and its value is an array of scalars.
// Each column should be the same length.
export namespace ColumnDataSource {
  export interface Attrs extends ColumnarDataSource.Attrs {
    data: {[key: string]: any[]}
  }

  export interface Opts extends ColumnarDataSource.Opts {}
}

export interface ColumnDataSource extends ColumnDataSource.Attrs {}

export class ColumnDataSource extends ColumnarDataSource {

  constructor(attrs?: Partial<ColumnDataSource.Attrs>, opts?: ColumnDataSource.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'ColumnDataSource'

    this.define({
      data: [ p.Any, {} ],
    })
  }

  initialize(): void {
    super.initialize();
    [this.data, this._shapes] = serialization.decode_column_data(this.data)
  }

  attributes_as_json(include_defaults: boolean = true, value_to_json = ColumnDataSource._value_to_json) {
    const attrs = {}
    const object = this.serializable_attributes()
    for (const key of Object.keys(object || {})) {
      let value = object[key]
      if (key === 'data') {
        value = serialization.encode_column_data(value, this._shapes)
      }
      if (include_defaults) {
        attrs[key] = value
      } else if (key in this._set_after_defaults) {
        attrs[key] = value
      }
    }
    return value_to_json("attributes", attrs, this)
  }

  static _value_to_json(key, value, optional_parent_object) {
    if (isObject(value) && (key === 'data')) {
      return serialization.encode_column_data(value, optional_parent_object._shapes)
    } else {
      return HasProps._value_to_json(key, value, optional_parent_object)
    }
  }

  stream(new_data, rollover) {
    const { data } = this
    for (const k in new_data) {
      data[k] = stream_to_column(data[k], new_data[k], rollover)
    }
    this.setv({data}, {silent: true})
    return this.streaming.emit(undefined)
  }

  patch(patches) {
    const { data } = this
    let patched = new Set()
    for (const k in patches) {
      const patch = patches[k]
      patched = patched.union(patch_to_column(data[k], patch, this._shapes[k]))
    }
    this.setv({data}, {silent: true})
    return this.patching.emit(patched.values)
  }
}
ColumnDataSource.initClass()
