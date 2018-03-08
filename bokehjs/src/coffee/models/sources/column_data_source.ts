import {ColumnarDataSource} from "./columnar_data_source"
import {HasProps} from "core/has_props"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import {Set} from "core/util/data_structures"
import {Shape, encode_column_data, decode_column_data} from "core/util/serialization"
import {isTypedArray, isArray, isNumber, isObject} from "core/util/types"
import {TypedArray} from "core/types"
import * as typed_array from "core/util/typed_array"
import {keys} from "core/util/object"

//exported for testing
export function stream_to_column(col: Arrayable, new_col: Arrayable, rollover?: number): Arrayable {
  if (isArray(col)) {
    const result = col.concat(new_col)

    if (rollover != null && result.length > rollover)
      return result.slice(-rollover)
    else
      return result
  } else if (isTypedArray(col)) {
    const total_len = col.length + new_col.length

    // handle rollover case for typed arrays
    if (rollover != null && total_len > rollover) {
      const start = total_len - rollover
      const end = col.length

      // resize col if it is shorter than the rollover length
      let result: TypedArray
      if (col.length < rollover) {
        result = new ((col as any).constructor)(rollover)
        result.set(col, 0)
      } else
        result = col

      // shift values in original col to accommodate new_col
      for (let i = start, endi = end; i < endi; i++) {
        result[i-start] = result[i]
      }

      // update end values in col with new_col
      for (let i = 0, endi = new_col.length; i < endi; i++) {
        result[i+(end-start)] = new_col[i]
      }

      return result
    } else {
      const tmp = new ((col as any).constructor)(new_col)
      return typed_array.concat(col, tmp)
    }
  } else
    throw new Error("unsupported array types")
}

// exported for testing
export function slice(ind: number | {start?: number, stop?: number, step?: number}, length: number): [number, number, number] {
  let start: number, step: number, stop: number

  if (isNumber(ind)) {
    start = ind
    stop  = ind + 1
    step  = 1
  } else {
    start = ind.start != null ? ind.start : 0
    stop  = ind.stop  != null ? ind.stop  : length
    step  = ind.step  != null ? ind.step  : 1
  }

  return [start, stop, step]
}

export type Index = number | [number, number] | [number, number, number]

// exported for testing
export function patch_to_column(col: Arrayable, patch: [Index, any][], shapes: Shape[]): Set<number> {
  const patched: Set<number> = new Set()
  let patched_range = false

  for (let [ind, value] of patch) {

    // make the single index case look like the length-3 multi-index case
    let item: Arrayable, shape: Shape
    if (isArray(ind)) {
      const [i] = ind
      patched.push(i)
      shape = shapes[i]
      item = col[i]
    } else  {
      if (isNumber(ind)) {
        value = [value]
        patched.push(ind)
      } else
        patched_range = true

      ind = [0, 0, ind]
      shape = [1, col.length]
      item = col
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
    data: {[key: string]: Arrayable}
  }
}

export interface ColumnDataSource extends ColumnDataSource.Attrs {}

export class ColumnDataSource extends ColumnarDataSource {

  constructor(attrs?: Partial<ColumnDataSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'ColumnDataSource'

    this.define({
      data: [ p.Any, {} ],
    })
  }

  initialize(): void {
    super.initialize();
    [this.data, this._shapes] = decode_column_data(this.data)
  }

  attributes_as_json(include_defaults: boolean = true, value_to_json = ColumnDataSource._value_to_json): any {
    const attrs: {[key: string]: any} = {}
    const obj = this.serializable_attributes()
    for (const key of keys(obj)) {
      let value = obj[key]
      if (key === 'data')
        value = encode_column_data(value, this._shapes)

      if (include_defaults)
        attrs[key] = value
      else if (key in this._set_after_defaults)
        attrs[key] = value
    }
    return value_to_json("attributes", attrs, this)
  }

  static _value_to_json(key: string, value: any, optional_parent_object: any): any {
    if (isObject(value) && key === 'data')
      return encode_column_data(value, optional_parent_object._shapes)
    else
      return HasProps._value_to_json(key, value, optional_parent_object)
  }

  stream(new_data: {[key: string]: any[]}, rollover?: number): void {
    const {data} = this
    for (const k in new_data) {
      data[k] = stream_to_column(data[k], new_data[k], rollover)
    }
    this.setv({data}, {silent: true})
    this.streaming.emit()
  }

  patch(patches: [Index, any][]): void {
    const {data} = this
    let patched: Set<number> = new Set()
    for (const k in patches) {
      const patch = patches[k]
      patched = patched.union(patch_to_column(data[k], patch, this._shapes[k] as Shape[]))
    }
    this.setv({data}, {silent: true})
    this.patching.emit(patched.values)
  }
}
ColumnDataSource.initClass()
