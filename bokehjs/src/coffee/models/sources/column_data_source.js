/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS202: Simplify dynamic range loops
 * DS203: Remove `|| {}` from converted for-own loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

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

    let i
    let asc, end1
    let asc1, end2
    const start = total_len - rollover
    const end = col.length

    // resize col if it is shorter than the rollover length
    if (col.length < rollover) {
      tmp = new (col.constructor)(rollover)
      tmp.set(col, 0)
      col = tmp
    }

    // shift values in original col to accommodate new_col
    for (i = start, end1 = end, asc = start <= end1; asc ? i < end1 : i > end1; asc ? i++ : i--) {
      col[i-start] = col[i]
    }

    // update end values in col with new_col
    for (i = 0, end2 = new_col.length, asc1 = 0 <= end2; asc1 ? i < end2 : i > end2; asc1 ? i++ : i--) {
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
  return [start, stop, step] = Array.from(ref = [ind, ind+1, 1]), ref
}

// exported for testing
export const patch_to_column = function(col, patch, shapes) {
  const patched = new Set()
  let patched_range = false

  for (let [ind, value] of Array.from(patch)) {

    // make the single index case look like the length-3 multi-index case
    var item, shape
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
    const [istart, istop, istep] = Array.from(slice(ind[1], shape[0]))
    const [jstart, jstop, jstep] = Array.from(slice(ind[2], shape[1]))

    for (let i = istart, end = istop, step = istep, asc = step > 0; asc ? i < end : i > end; i += step) {
      for (let j = jstart, end1 = jstop, step1 = jstep, asc1 = step1 > 0; asc1 ? j < end1 : j > end1; j += step1) {
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
export class ColumnDataSource extends ColumnarDataSource {
  static initClass() {
    this.prototype.type = 'ColumnDataSource'

    this.define({
      data:         [ p.Any,   {} ]
    })
  }

  initialize(options) {
    let ref
    super.initialize(options)
    return [this.data, this._shapes] = Array.from(ref = serialization.decode_column_data(this.data)), ref
  }

  attributes_as_json(include_defaults: boolean = true, value_to_json = ColumnDataSource._value_to_json) {
    const attrs = {}
    const object = this.serializable_attributes()
    for (let key of Object.keys(object || {})) {
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
    for (let k in new_data) {
      const v = new_data[k]
      data[k] = stream_to_column(data[k], new_data[k], rollover)
    }
    this.setv({data}, {silent: true})
    return this.streaming.emit()
  }

  patch(patches) {
    const { data } = this
    let patched = new Set()
    for (let k in patches) {
      const patch = patches[k]
      patched = patched.union(patch_to_column(data[k], patch, this._shapes[k]))
    }
    this.setv({data}, {silent: true})
    return this.patching.emit(patched.values)
  }
}
ColumnDataSource.initClass()
