import {ID, ByteOrder, DataType} from "../types"
import {Ref, is_ref} from "./refs"
import {isPlainObject, isString} from "./types"
import type {NDArray} from "./ndarray"
import {BYTE_ORDER} from "./platform"
import {swap, base64_to_buffer, buffer_to_base64} from "./buffer"
import {Comparator, Equatable, equals} from "./eq"

export class Base64Buffer implements Equatable {
  constructor(readonly buffer: ArrayBuffer) {}

  toJSON(): string {
    return buffer_to_base64(this.buffer)
  }

  [equals](that: Base64Buffer, cmp: Comparator): boolean {
    return cmp.eq(this.buffer, that.buffer)
  }
}

export type Shape = number[]

export type NDArrayRef = {
  type: "ndarray"
  array: Ref | string | Base64Buffer
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export function is_NDArray_ref(v: unknown): v is NDArrayRef {
  return isPlainObject(v) && v.type == "ndarray"
}

export type Buffers = Map<ID, ArrayBuffer>

export function decode_NDArray(ref: NDArrayRef, buffers: Buffers): {buffer: ArrayBuffer, dtype: DataType, shape: Shape} {
  const {shape, dtype, order} = ref

  let bytes: ArrayBuffer
  if (is_ref(ref.array)) {
    const buffer = buffers.get(ref.array.id)
    if (buffer != null)
      bytes = buffer
    else
      throw new Error(`buffer for ${ref.array} not found`)
  } else if (isString(ref.array)) {
    bytes = base64_to_buffer(ref.array)
  } else {
    bytes = ref.array.buffer
  }

  if (order != BYTE_ORDER) {
    swap(bytes, dtype)
  }

  return {buffer: bytes, dtype, shape}
}

export function encode_NDArray(array: NDArray, buffers?: Buffers): NDArrayRef {
  const data = {
    order: BYTE_ORDER,
    dtype: array.dtype,
    shape: array.shape,
  }

  if (buffers != null) {
    const ref = {id: `${buffers.size}`}
    buffers.set(ref.id, array.buffer)
    return {type: "ndarray", array: ref, ...data}
  } else {
    const rep = new Base64Buffer(array.buffer)
    return {type: "ndarray", array: rep, ...data}
  }
}
