import type {Arrayable, Data, Dict} from "core/types"
import {isTypedArray, isArray, isNumber} from "core/util/types"
import type {NDArray} from "core/util/ndarray"
import {dict} from "core/util/object"
import {union} from "core/util/set"
import type {Slice} from "core/util/slice"
import * as typed_array from "core/util/typed_array"

// exported for testing
export function stream_to_column(col: Arrayable, new_col: Arrayable, rollover?: number): Arrayable {
  if (isArray(col) && isArray(new_col)) {
    const result = col.concat(new_col)

    if (rollover != null && result.length > rollover) {
      return result.slice(-rollover)
    } else {
      return result
    }
  }

  const total_len = col.length + new_col.length

  // handle rollover case for typed arrays
  if (rollover != null && total_len > rollover) {
    const start = total_len - rollover
    const end = col.length

    // resize col if it is shorter than the rollover length
    const result = (() => {
      if (col.length < rollover) {
        const ctor = (() => {
          if (isTypedArray(col)) {
            return col.constructor
          } else if (isTypedArray(new_col)) {
            return new_col.constructor
          } else {
            throw new Error("unsupported array types")
          }
        })()

        const result = new ctor(rollover)
        result.set(col, 0)
        return result
      } else {
        return col
      }
    })()

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
    const col_ = (() => {
      if (isTypedArray(col)) {
        return col
      } else if (isTypedArray(new_col)) {
        return new new_col.constructor(col)
      } else {
        throw new Error("unsupported array types")
      }
    })()
    return typed_array.concat(col_, new_col)
  }
}

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

export type PatchSet<T> = Dict<Patch<T>[]>

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
      } else {
        index = ind
      }
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

export function stream_to_columns(old_data: Data, new_data: Data, rollover?: number): void {
  const data = dict(old_data)
  for (const [name, new_column] of dict(new_data)) {
    const old_column = data.get(name) ?? []
    data.set(name, stream_to_column(old_column, new_column, rollover))
  }
}

export function patch_to_columns(old_data: Data, patches: PatchSet<unknown>): Set<number> {
  const data = dict(old_data)
  let patched: Set<number> = new Set()
  for (const [name, patch] of dict(patches)) {
    const old_column = data.get(name) ?? []
    patched = union(patched, patch_to_column(old_column as any, patch)) // XXX: any
  }
  return patched
}
