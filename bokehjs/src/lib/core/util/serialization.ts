import {ID, ByteOrder, DataType} from "../types"
import {isPlainObject} from "./types"
import type {NDArray} from "./ndarray"
import {BYTE_ORDER} from "./platform"
import {swap, base64_to_buffer, buffer_to_base64} from "./buffer"

export type Shape = number[]

export type BufferRef = {
  __buffer__: string
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export type NDArrayRef = {
  __ndarray__: string | {toJSON(): string}
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export function is_NDArray_ref(v: unknown): v is BufferRef | NDArrayRef {
  return isPlainObject(v) && ("__buffer__" in v || "__ndarray__" in v)
}

export type Buffers = Map<ID, ArrayBuffer>

export function decode_NDArray(ref: BufferRef | NDArrayRef, buffers: Buffers): {buffer: ArrayBuffer, dtype: DataType, shape: Shape} {
  const {shape, dtype, order} = ref

  let bytes: ArrayBuffer
  if ("__buffer__" in ref) {
    const buffer = buffers.get(ref.__buffer__)
    if (buffer != null)
      bytes = buffer
    else
      throw new Error(`buffer for ${ref.__buffer__} not found`)
  } else {
    bytes = base64_to_buffer(ref.__ndarray__ as string)
  }

  if (order !== BYTE_ORDER) {
    swap(bytes, dtype)
  }

  return {buffer: bytes, dtype, shape}
}

export function encode_NDArray(array: NDArray, buffers?: Buffers): BufferRef | NDArrayRef {
  const data = {
    order: BYTE_ORDER,
    dtype: array.dtype,
    shape: array.shape,
  }

  if (buffers != null) {
    const __buffer__ = `${buffers.size}`
    buffers.set(__buffer__, array.buffer)
    return {__buffer__, ...data}
  } else {
    const __ndarray__ = {
      toJSON(): string {
        return buffer_to_base64(array.buffer)
      },
    }
    return {__ndarray__, ...data}
  }
}
