import {ColumnarDataSource} from "./columnar_data_source"
import {Arrayable, Data} from "core/types"
import * as p from "core/properties"
import {isTypedArray, isArray, isNumber} from "core/util/types"
import {TypedArray} from "core/types"
import {NDArray} from "core/util/ndarray"
import {entries} from "core/util/object"
import * as typed_array from "core/util/typed_array"
import {union} from "core/util/set"
import {ColumnsPatchedEvent, ColumnsStreamedEvent} from "document/events"

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
        result = new col.constructor(rollover)
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
      const tmp = new col.constructor(new_col)
      return typed_array.concat(col, tmp)
    }
  } else
    throw new Error("unsupported array types")
}

export type Slice = {start?: number, stop?: number, step?: number}

// exported for testing
export function slice(ind: number | Slice, length: number): [number, number, number] {
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

export type Patch<T> = [number, T] | [[number, number | Slice] | [number, number | Slice, number | Slice], T[]] | [Slice, T[]]

export type PatchSet<T> = {[key: string]: Patch<T>[]}

// exported for testing
export function patch_to_column<T>(col: NDArray | NDArray[], patch: Patch<T>[]): Set<number> {
  const patched: Set<number> = new Set()
  let patched_range = false

  for (const [ind, val] of patch) {

    // make the single index case look like the length-3 multi-index case
    let shape: number[]
    let item: Arrayable
    let index: [number, number | Slice, number | Slice]
    let value: unknown[]
    if (isArray(ind)) {
      const [i] = ind
      patched.add(i)
      shape = (col[i] as NDArray).shape
      item = col[i] as NDArray
      value = val as unknown[]

      // this is basically like NumPy's "newaxis", inserting an empty dimension
      // makes length 2 and 3 multi-index cases uniform, so that the same code
      // can handle both
      if (ind.length === 2) {
        shape = [1, shape[0]]
        index = [ind[0], 0, ind[1]]
      } else
        index = ind
    } else {
      if (isNumber(ind)) {
        value = [val]
        patched.add(ind)
      } else {
        value = val as unknown[]
        patched_range = true
      }

      index = [0, 0, ind]
      shape = [1, col.length]
      item = col
    }

    // now this one nested loop handles all cases
    let flat_index = 0
    const [istart, istop, istep] = slice(index[1], shape[0])
    const [jstart, jstop, jstep] = slice(index[2], shape[1])

    for (let i = istart; i < istop; i += istep) {
      for (let j = jstart; j < jstop; j += jstep) {
        if (patched_range) {
          patched.add(j)
        }
        item[i*shape[1] + j] = value[flat_index]
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
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnarDataSource.Props & {
    data: p.Property<{[key: string]: Arrayable}>
  }
}

export interface ColumnDataSource extends ColumnDataSource.Attrs {}

export class ColumnDataSource extends ColumnarDataSource {
  properties: ColumnDataSource.Props

  constructor(attrs?: Partial<ColumnDataSource.Attrs>) {
    super(attrs)
  }

  static init_ColumnDataSource(): void {
    this.define<ColumnDataSource.Props>({
      data: [ p.Any, {} ],
    })
  }

  stream(new_data: Data, rollover?: number, setter_id?: string): void {
    const {data} = this
    for (const k in new_data) {
      data[k] = stream_to_column(data[k], new_data[k], rollover)
    }
    this.setv({data}, {silent: true})
    this.streaming.emit()
    if (this.document != null) {
      const hint = new ColumnsStreamedEvent(this.document, this.ref(), new_data, rollover)
      this.document._notify_change(this, 'data', null, null, {setter_id, hint})
    }
  }

  patch(patches: PatchSet<unknown>, setter_id?: string): void {
    const {data} = this
    let patched: Set<number> = new Set()
    for (const [column, patch] of entries(patches)) {
      patched = union(patched, patch_to_column(data[column] as any, patch)) // XXX
    }
    this.setv({data}, {silent: true})
    this.patching.emit([...patched])
    if (this.document != null) {
      const hint = new ColumnsPatchedEvent(this.document, this.ref(), patches)
      this.document._notify_change(this, 'data', null, null, {setter_id, hint})
    }
  }
}
