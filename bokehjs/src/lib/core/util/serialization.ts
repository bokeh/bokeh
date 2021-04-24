import {ID, ByteOrder} from "../types"
import {isPlainObject} from "./types"
import {DataType, NDArray} from "./ndarray"
import * as ndarray from "./ndarray"
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

export function decode_NDArray(ref: BufferRef | NDArrayRef, buffers: Buffers): NDArray {
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

  const array = (() => {
    switch (dtype) {
      case "uint8":   return new ndarray.Uint8NDArray(bytes, shape)
      case "int8":    return new ndarray.Int8NDArray(bytes, shape)
      case "uint16":  return new ndarray.Uint16NDArray(bytes, shape)
      case "int16":   return new ndarray.Int16NDArray(bytes, shape)
      case "uint32":  return new ndarray.Uint32NDArray(bytes, shape)
      case "int32":   return new ndarray.Int32NDArray(bytes, shape)
      case "float32": return new ndarray.Float32NDArray(bytes, shape)
      case "float64": return new ndarray.Float64NDArray(bytes, shape)
    }
  })()

  if (order !== BYTE_ORDER) {
    swap(array)
  }

  return array
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
