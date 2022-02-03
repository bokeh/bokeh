import {ID, ByteOrder, DataType} from "../types"
import {Ref, is_ref} from "./refs"
import {isString} from "./types"
import type {NDArray} from "./ndarray"
import {BYTE_ORDER} from "./platform"
import {base64_to_buffer, buffer_to_base64} from "./buffer"
import {Comparator, Equatable, equals} from "./eq"
import {Serializer} from "../serializer"
import {type ArrayRep} from "../deserializer"

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

export type NDArrayRep = {
  type: "ndarray"
  array: BytesRep | ArrayRep
  order: ByteOrder
  dtype: DataType
  shape: Shape
}

export type BytesRep = {
  type: "bytes"
  data: Bytes
}

export type Bytes = Ref | string | Base64Buffer

export type Buffers = Map<ID, ArrayBuffer>

export function decode_bytes(rep: BytesRep, buffers: Buffers): ArrayBuffer {
  const {data} = rep
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

export function encode_bytes(bytes: ArrayBuffer, buffers?: Buffers): BytesRep {
  if (buffers != null) {
    const ref = {id: `${buffers.size}`}
    buffers.set(ref.id, bytes)
    return {type: "bytes", data: ref}
  } else {
    const rep = new Base64Buffer(bytes)
    return {type: "bytes", data: rep}
  }
}

export function encode_NDArray(array: NDArray, serializer: Serializer): NDArrayRep {
  const encoded = serializer.encode(array.dtype == "object" ? Array.from(array) : array.buffer)
  return {
    type: "ndarray",
    array: encoded as ArrayRep | BytesRep,
    order: BYTE_ORDER,
    dtype: array.dtype,
    shape: array.shape,
  }
}
