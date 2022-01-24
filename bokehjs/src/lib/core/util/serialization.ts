import {ID, ByteOrder, DataType} from "../types"
import {Ref, is_ref} from "./refs"
import {isString} from "./types"
import type {NDArray} from "./ndarray"
import {BYTE_ORDER} from "./platform"
import {base64_to_buffer, buffer_to_base64} from "./buffer"
import {Comparator, Equatable, equals} from "./eq"
import {type ArrayRef} from "../deserializer"

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
  array: BytesRef | ArrayRef
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export type BytesRef = {
  type: "bytes"
  data: Bytes
}

export type Bytes = Ref | string | Base64Buffer

export type Buffers = Map<ID, ArrayBuffer>

export function decode_bytes(ref: BytesRef, buffers: Buffers): ArrayBuffer {
  const {data} = ref
  if (is_ref(data)) {
    const buffer = buffers.get(data.id)
    if (buffer != null)
      return buffer
    else
      throw new Error(`buffer for id=${data.id} not found`)
  } else if (isString(data))
    return base64_to_buffer(data)
  else
    return data.buffer
}

export function encode_bytes(bytes: ArrayBuffer, buffers?: Buffers): BytesRef {
  if (buffers != null) {
    const ref = {id: `${buffers.size}`}
    buffers.set(ref.id, bytes)
    return {type: "bytes", data: ref}
  } else {
    const rep = new Base64Buffer(bytes)
    return {type: "bytes", data: rep}
  }
}

export function encode_NDArray(array: NDArray, buffers?: Buffers): NDArrayRef {
  return {
    type: "ndarray",
    array: encode_bytes(array.buffer, buffers),
    order: BYTE_ORDER,
    dtype: array.dtype,
    shape: array.shape,
  }
}
