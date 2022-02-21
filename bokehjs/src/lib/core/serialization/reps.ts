import {ByteOrder, DataType} from "../types"
import {Ref} from "../util/refs"
import {buffer_to_base64} from "../util/buffer"
import {Comparator, Equatable, equals} from "../util/eq"

export class Buffer implements Equatable {
  constructor(readonly buffer: ArrayBuffer) {}

  to_base64(): string {
    return buffer_to_base64(this.buffer)
  }

  [equals](that: Buffer, cmp: Comparator): boolean {
    return cmp.eq(this.buffer, that.buffer)
  }
}

export class Base64Buffer extends Buffer {
  toJSON(): string {
    return this.to_base64()
  }
}

export type AnyVal = null | boolean | number | string | Ref | AnyRep | AnyVal[] | {[key: string]: AnyVal}
export type AnyRep = NumberRep | ArrayRep | SetRep | MapRep | BytesRep | NDArrayRep | ModelRep | TypeRep

export type NumberRep = {
  type: "number"
  value: number | "nan" | "-inf" | "+inf"
}

export type ArrayRep = {
  type: "array"
  entries: AnyVal[]
}

export type SetRep = {
  type: "set"
  entries: AnyVal[]
}

export type MapRep = {
  type: "map"
  entries: [AnyVal, AnyVal][]
}

export type BytesRep = {
  type: "bytes"
  data: Bytes
}

export type Bytes = Ref | string | Buffer

export type SliceRep = {
  type: "slice"
  start: number | null
  stop: number | null
  step: number | null
}

export type TypeRep = {
  type: string
  attributes: {[key: string]: AnyVal}
}

export type ModelRep = TypeRep & {
  id: string
}

export type Shape = number[]

export type NDArrayRep = {
  type: "ndarray"
  array: BytesRep | ArrayRep
  order: ByteOrder
  dtype: DataType
  shape: Shape
}
