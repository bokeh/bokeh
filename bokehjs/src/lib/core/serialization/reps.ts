import type {ByteOrder, DataType, NDDataType} from "../types"
import type {Ref} from "../util/refs"
import type {Buffer} from "./buffer"

export type AnyVal = null | boolean | number | string | Date | Ref | AnyRep | AnyVal[] | {[key: string]: AnyVal}
export type AnyRep = SymbolRep | NumberRep | ArrayRep | SetRep | MapRep | BytesRep | TypedArrayRep | NDArrayRep | ObjectRep | ObjectRefRep

export type SymbolRep = {
  type: "symbol"
  name: string
}

export type NumberRep = {
  type: "number"
  value: number | "nan" | "-inf" | "+inf"
}

export type ArrayRep = {
  type: "array"
  entries?: AnyVal[]
}

export type SetRep = {
  type: "set"
  entries?: AnyVal[]
}

export type MapRep = {
  type: "map"
  entries?: [AnyVal, AnyVal][]
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

export type DateRep = {
  type: "date"
  iso: string
}

export type ValueRep = {
  type: "value"
  value: AnyVal
  transform?: AnyVal
  units?: AnyVal
}

export type FieldRep = {
  type: "field"
  field: string
  transform?: AnyVal
  units?: AnyVal
}

export type ExprRep = {
  type: "expr"
  expr: AnyVal
  transform?: AnyVal
  units?: AnyVal
}

export type ObjectRep = {
  type: "object"
  name: string
  attributes?: {[key: string]: AnyVal}
}

export type ObjectRefRep = {
  type: "object"
  name: string
  id: string
  attributes?: {[key: string]: AnyVal}
}

export type ModelRep = ObjectRefRep

export type TypedArrayRep = {
  type: "typed_array"
  array: BytesRep
  order: ByteOrder
  dtype: DataType
}

export type Shape = number[]

export type NDArrayRep = {
  type: "ndarray"
  array: BytesRep | ArrayRep
  order: ByteOrder
  dtype: NDDataType
  shape: Shape
}
