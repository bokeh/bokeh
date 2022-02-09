import {ByteOrder, DataType} from "../types"
import type {NDArray} from "./ndarray"
import {BYTE_ORDER} from "./platform"
import {Serializer} from "../serializer"
import {ArrayRep, BytesRep} from "../deserializer"

export type Shape = number[]

export type NDArrayRep = {
  type: "ndarray"
  array: BytesRep | ArrayRep
  order: ByteOrder
  dtype: DataType
  shape: Shape
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
