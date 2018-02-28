import {isArray, isObject} from "./types"
import {map} from "./array"

export type TypedArray =
  Uint8Array   | Int8Array    |
  Uint16Array  | Int16Array   |
  Uint32Array  | Int32Array   |
  Float32Array | Float64Array

export function isTypedArray(v: any): v is TypedArray {
  return v != null && v.buffer != null && v.buffer instanceof ArrayBuffer
}

export const ARRAY_TYPES = {
  uint8:   Uint8Array,
  int8:    Int8Array,
  uint16:  Uint16Array,
  int16:   Int16Array,
  uint32:  Uint32Array,
  int32:   Int32Array,
  float32: Float32Array,
  float64: Float64Array,
}

export const DTYPES = {
  Uint8Array:   "uint8"   as "uint8",
  Int8Array:    "int8"    as "int8",
  Uint16Array:  "uint16"  as "uint16",
  Int16Array:   "int16"   as "int16",
  Uint32Array:  "uint32"  as "uint32",
  Int32Array:   "int32"   as "int32",
  Float32Array: "float32" as "float32",
  Float64Array: "float64" as "float64",
}

export type ArrayName = keyof typeof DTYPES

export type DType = keyof typeof ARRAY_TYPES

export type ByteOrder = "little" | "big"

export const BYTE_ORDER: ByteOrder = (() => {
  // record endian-ness
  const buf = new ArrayBuffer(2)
  const buf8 = new Uint8Array(buf)
  const buf16 = new Uint16Array(buf)
  buf8[0] = 0xAA
  buf8[1] = 0xBB
  if (buf16[0] === 0xBBAA)
    return "little"
  else
    return "big"
})()

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

export interface BufferSpec {
  __buffer__: string
  order: ByteOrder
  dtype: DType
  shape: Shape
}

export function process_buffer(spec: BufferSpec, buffers: [any, any][]): [TypedArray, Shape] {
  const need_swap = spec.order !== BYTE_ORDER
  const {shape} = spec
  let bytes = null
  for (const buf of buffers) {
    const header = JSON.parse(buf[0])
    if (header.id === spec.__buffer__) {
      bytes = buf[1]
      break
    }
  }
  const arr = new (ARRAY_TYPES[spec.dtype])(bytes)
  if (need_swap) {
    if (arr.BYTES_PER_ELEMENT === 2) {
      swap16(arr)
    } else if (arr.BYTES_PER_ELEMENT === 4) {
      swap32(arr)
    } else if (arr.BYTES_PER_ELEMENT === 8) {
      swap64(arr)
    }
  }
  return [arr, shape]
}

export function process_array(obj: NDArray | BufferSpec | ArrayLike<any>, buffers: [any, any][]): [ArrayLike<any>, number[]] {
  if (isObject(obj) && '__ndarray__' in obj)
    return decode_base64(obj)
  else if (isObject(obj) && '__buffer__' in obj)
    return process_buffer(obj, buffers)
  else if (isArray(obj))
    return [obj, []]
  else
    return undefined as never
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const binary = map(bytes, (b) => String.fromCharCode(b))
  return btoa(binary.join(""))
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64)
  const len = binary_string.length
  const bytes = new Uint8Array(len)
  for (let i = 0, end = len; i < end; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

export interface NDArray {
  __ndarray__: string
  shape?: Shape
  dtype: DType
}

export function decode_base64(input: NDArray): [TypedArray, Shape] {
  const bytes = base64ToArrayBuffer(input.__ndarray__)
  const dtype = input.dtype
  const shape = input.shape!

  let array: TypedArray
  if (dtype in ARRAY_TYPES)
    array = new (ARRAY_TYPES[dtype])(bytes)
  else
    throw new Error(`unknown dtype: ${dtype}`)

  return [array, shape]
}

export function encode_base64(array: TypedArray, shape?: Shape): NDArray {
  const b64 = arrayBufferToBase64(array.buffer)
  const name = array.constructor.name

  let dtype: DType
  if (name in DTYPES)
    dtype = DTYPES[name as ArrayName]
  else
    throw new Error(`unknown array type: ${name}`)

  const data = {
    __ndarray__: b64,
    shape,
    dtype,
  }
  return data
}

export type Data = {[key: string]: ArrayLike<any>}

export type Shapes = {[key: string]: Shape | Shape[]}

export type EncodedData = {[key: string]: NDArray | ArrayLike<any>}

export function decode_column_data(data: EncodedData, buffers: [any, any][] = []): [Data, Shapes] {
  const new_data: Data = {}
  const new_shapes: Shapes = {}

  for (const k in data) {

    // might be array of scalars, or might be ragged array or arrays
    const v = data[k]
    if (isArray(v)) {

      // v is just a regular array of scalars
      if (v.length == 0 || !(isObject(v[0]) || isArray(v[0]))) {
        new_data[k] = v
        continue
      }

      // v is a ragged array of arrays
      const arrays: ArrayLike<any>[] = []
      const shapes: Shape[] = []
      for (const obj of v) {
        const [arr, shape] = process_array(obj as NDArray, buffers)
        arrays.push(arr)
        shapes.push(shape)
      }

      new_data[k] = arrays
      new_shapes[k] = shapes

    // must be object or array (single array case)
    } else {
      const [arr, shape] = process_array(v, buffers)
      new_data[k] = arr
      new_shapes[k] = shape
    }
  }

  return [new_data, new_shapes]
}

export function encode_column_data(data: Data, shapes?: Shapes): EncodedData {
  const new_data: EncodedData = {}
  for (const k in data) {
    let v = data[k]
    let new_v: NDArray | ArrayLike<any>
    if (isTypedArray(v)) {
      new_v = encode_base64(v, shapes != null ? shapes[k] as Shape : undefined)
    } else if (isArray(v)) {
      const new_array: any[] = []
      for (let i = 0, end = v.length; i < end; i++) {
        const item = v[i]
        if (isTypedArray(item)) {
          const shape = shapes != null && shapes[k] != null ? (shapes[k] as Shape[])[i] : undefined
          new_array.push(encode_base64(item, shape))
        } else
          new_array.push(item)
      }
      new_v = new_array
    } else
      new_v = v
    new_data[k] = new_v
  }
  return new_data
}
