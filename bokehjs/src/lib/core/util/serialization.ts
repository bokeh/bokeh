import {ID} from "../types"
import {isPlainObject} from "./types"
import {is_little_endian} from "./compat"
import {DataType, NDArray} from "./ndarray"
import * as ndarray from "./ndarray"

export function buffer_to_base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chars = Array.from(bytes).map((b) => String.fromCharCode(b))
  return btoa(chars.join(""))
}

export function base64_to_buffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0, end = len; i < end; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

export type ByteOrder = "little" | "big"

export const BYTE_ORDER: ByteOrder = is_little_endian ? "little" : "big"

export function swap16(a: Int16Array | Uint16Array): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 2)
  for (let i = 0, end = x.length; i < end; i += 2) {
    const t = x[i]
    x[i] = x[i + 1]
    x[i + 1] = t
  }
}

export function swap32(a: Int32Array | Uint32Array | Float32Array): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 4)
  for (let i = 0, end = x.length; i < end; i += 4) {
    let t = x[i]
    x[i] = x[i + 3]
    x[i + 3] = t
    t = x[i + 1]
    x[i + 1] = x[i + 2]
    x[i + 2] = t
  }
}

export function swap64(a: Float64Array): void {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 8)
  for (let i = 0, end = x.length; i < end; i += 8) {
    let t = x[i]
    x[i] = x[i + 7]
    x[i + 7] = t
    t = x[i + 1]
    x[i + 1] = x[i + 6]
    x[i + 6] = t
    t = x[i + 2]
    x[i + 2] = x[i + 5]
    x[i + 5] = t
    t = x[i + 3]
    x[i + 3] = x[i + 4]
    x[i + 4] = t
  }
}

export type Shape = number[]

export type BufferRef = {
  __buffer__: string
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export type NDArrayRef = {
  __ndarray__: string
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
    bytes = base64_to_buffer(ref.__ndarray__)
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
    switch (array.BYTES_PER_ELEMENT) {
      case 2:
        swap16(array as Int16Array | Uint16Array)
        break
      case 4:
        swap32(array as Int32Array | Uint32Array | Float32Array)
        break
      case 8:
        swap64(array as Float64Array)
        break
    }
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
    const __ndarray__ = buffer_to_base64(array.buffer)
    return {__ndarray__, ...data}
  }
}
