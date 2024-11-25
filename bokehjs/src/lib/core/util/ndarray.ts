import type {NDDataType, Arrayable} from "../types"
import {isObject, isNumber, is_ArrayBufferLike} from "./types"
import {BYTE_ORDER} from "./platform"
import type {Equatable, Comparator} from "./eq"
import {equals} from "./eq"
import type {Cloner, Cloneable} from "./cloneable"
import {clone} from "./cloneable"
import type {Serializable, Serializer, ArrayRep, BytesRep, NDArrayRep} from "../serialization"
import {serialize} from "../serialization"

const __ndarray__ = Symbol("__ndarray__")

function encode_NDArray(array: NDArray, serializer: Serializer): NDArrayRep {
  const encoded = serializer.encode(array.dtype == "object" ? Array.from(array) : array.buffer)
  return {
    type: "ndarray",
    array: encoded as ArrayRep | BytesRep,
    order: BYTE_ORDER,
    dtype: array.dtype,
    shape: array.shape,
  }
}

export interface NDArrayType<T, U=T> extends Arrayable<U>, Equatable, Cloneable, Serializable {
  readonly [__ndarray__]: boolean
  readonly dtype: NDDataType
  readonly shape: number[]
  readonly dimension: number
  get(i: number): T // TODO: multi-dimensional indices
  [i: number]: U
}

type Init<T> = number | ArrayBufferLike | ArrayLike<T>

export class BoolNDArray extends Uint8Array implements NDArrayType<boolean, number> {
  readonly [__ndarray__] = true
  readonly dtype: "bool" = "bool"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new BoolNDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): boolean {
    return this[i] == 1
  }
}

export class Uint8NDArray extends Uint8Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "uint8" = "uint8"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Uint8NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Int8NDArray extends Int8Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "int8" = "int8"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Int8NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Uint16NDArray extends Uint16Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "uint16" = "uint16"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Uint16NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Int16NDArray extends Int16Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "int16" = "int16"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Int16NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Uint32NDArray extends Uint32Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "uint32" = "uint32"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Uint32NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Int32NDArray extends Int32Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "int32" = "int32"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Int32NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Float32NDArray extends Float32Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "float32" = "float32"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Float32NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class Float64NDArray extends Float64Array implements NDArrayType<number> {
  readonly [__ndarray__] = true
  readonly dtype: "float64" = "float64"
  readonly shape: number[]
  readonly dimension: number

  constructor(init: Init<number>, shape?: number[]) {
    super(init as any) // XXX: typescript bug?
    this.shape = shape ?? (is_NDArray(init) ? init.shape : [this.length])
    this.dimension = this.shape.length
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new Float64NDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): number {
    return this[i]
  }
}

export class ObjectNDArray<T=unknown> extends Array<T> implements NDArrayType<T> {
  readonly [__ndarray__] = true
  readonly dtype: "object" = "object"

  private _shape?: number[]

  get shape(): number[] {
    return this._shape ?? [this.length]
  }

  get dimension(): number {
    return this.shape.length
  }

  constructor(init_: Init<T>, shape?: number[]) {
    const init = is_ArrayBufferLike(init_) ? new Float64Array(init_) : init_
    const size = isNumber(init) ? init : init.length

    super(size)

    if (!isNumber(init)) {
      for (let i = 0; i < init.length; i++) {
        this[i] = init[i] as T
      }
    }

    this._shape = shape ?? (is_NDArray(init) ? init.shape : undefined)
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }

  [clone](cloner: Cloner): this {
    return new ObjectNDArray(this, cloner.clone(this.shape)) as this
  }

  [serialize](serializer: Serializer): unknown {
    return encode_NDArray(this, serializer)
  }

  get(i: number): T {
    return this[i]
  }
}

export type NDArray =
  BoolNDArray    |
  Uint8NDArray   | Int8NDArray    |
  Uint16NDArray  | Int16NDArray   |
  Uint32NDArray  | Int32NDArray   |
  Float32NDArray | Float64NDArray |
  ObjectNDArray

export function is_NDArray(v: unknown): v is NDArray {
  return isObject(v) && __ndarray__ in v
}

export type NDArrayTypes = {
  bool:    {array: Uint8Array,   ndarray: BoolNDArray}
  uint8:   {array: Uint8Array,   ndarray: Uint8NDArray}
  int8:    {array: Int8Array,    ndarray: Int8NDArray}
  uint16:  {array: Uint16Array,  ndarray: Uint16NDArray}
  int16:   {array: Int16Array,   ndarray: Int16NDArray}
  uint32:  {array: Uint32Array,  ndarray: Uint32NDArray}
  int32:   {array: Int32Array,   ndarray: Int32NDArray}
  float32: {array: Float32Array, ndarray: Float32NDArray}
  float64: {array: Float64Array, ndarray: Float64NDArray}
  object:  {array: unknown[],    ndarray: ObjectNDArray}
}

type ArrayNd<S extends number[]> = {dimension: S["length"], shape: S}

type Array1d = ArrayNd<[number]>
type Array2d = ArrayNd<[number, number]>

export type Uint32Array1d  = Uint32NDArray  & Array1d
export type Uint8Array1d   = Uint8NDArray   & Array1d
export type Uint8Array2d   = Uint8NDArray   & Array2d
export type Float32Array2d = Float32NDArray & Array2d
export type Float64Array2d = Float64NDArray & Array2d
export type FloatArray2d   = Float32Array2d | Float64Array2d

export function ndarray<S extends number[]>(init: number | ArrayBufferLike | ArrayLike<unknown>, options?: {shape?: S}): NDArrayTypes["object"]["ndarray"] & ArrayNd<S>
export function ndarray<K extends NDDataType, S extends number[]>(init: number | ArrayBufferLike | ArrayLike<number>, options?: {dtype: K, shape?: S}): NDArrayTypes[K]["ndarray"] & ArrayNd<S>
export function ndarray<S extends number[]>(init: ArrayLike<unknown>, options?: {dtype: "object", shape?: S}): NDArrayTypes["object"]["ndarray"] & ArrayNd<S>

export function ndarray(init: number | ArrayBufferLike | ArrayLike<unknown>, {dtype, shape}: {dtype?: NDDataType, shape?: number[]} = {}): NDArray {
  if (dtype == null) {
    dtype = (() => {
      switch (true) {
        case init instanceof Uint8Array:   return "uint8"
        case init instanceof Int8Array:    return "int8"
        case init instanceof Uint16Array:  return "uint16"
        case init instanceof Int16Array:   return "int16"
        case init instanceof Uint32Array:  return "uint32"
        case init instanceof Int32Array:   return "int32"
        case init instanceof Float32Array: return "float32"
        case init instanceof Float64Array: return "float64"
        default: {
          if (is_ArrayBufferLike(init)) {
            return "float64"
          } else {
            return "object"
          }
        }
      }
    })()
  }

  switch (dtype) {
    case "bool":    return new BoolNDArray(init as Init<number>, shape)
    case "uint8":   return new Uint8NDArray(init as Init<number>, shape)
    case "int8":    return new Int8NDArray(init as Init<number>, shape)
    case "uint16":  return new Uint16NDArray(init as Init<number>, shape)
    case "int16":   return new Int16NDArray(init as Init<number>, shape)
    case "uint32":  return new Uint32NDArray(init as Init<number>, shape)
    case "int32":   return new Int32NDArray(init as Init<number>, shape)
    case "float32": return new Float32NDArray(init as Init<number>, shape)
    case "float64": return new Float64NDArray(init as Init<number>, shape)
    case "object":  return new ObjectNDArray(init, shape)
  }
}
