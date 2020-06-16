import {isObject, isArray} from "./types"
import {unreachable} from "./assert"
import {equals, Equals, Comparator} from "./eq"

export type DataType = "uint8" | "int8" | "uint16" | "int16" | "uint32" | "int32" | "float32" | "float64"

const __ndarray__ = Symbol("__ndarray__")

export class Uint8NDArray extends Uint8Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "uint8" = "uint8"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? [this.length]
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Int8NDArray extends Int8Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "int8" = "int8"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Uint16NDArray extends Uint16Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "uint16" = "uint16"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Int16NDArray extends Int16Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "int16" = "int16"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Uint32NDArray extends Uint32Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "uint32" = "uint32"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Int32NDArray extends Int32Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "int32" = "int32"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Float32NDArray extends Float32Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "float32" = "float32"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export class Float64NDArray extends Float64Array implements Equals {
  readonly __ndarray__ = __ndarray__
  readonly dtype: "float64" = "float64"
  readonly shape: number[]

  constructor(seq: ArrayLike<number> | ArrayBufferLike, shape?: number[]) {
    super(seq)
    this.shape = shape ?? (is_NDArray(seq) ? seq.shape : [this.length])
  }

  [equals](that: this, cmp: Comparator): boolean {
    return cmp.eq(this.shape, that.shape) && cmp.arrays(this, that)
  }
}

export type TypedArray =
  Uint8Array   | Int8Array    |
  Uint16Array  | Int16Array   |
  Uint32Array  | Int32Array   |
  Float32Array | Float64Array

export type NDArray =
  Uint8NDArray   | Int8NDArray    |
  Uint16NDArray  | Int16NDArray   |
  Uint32NDArray  | Int32NDArray   |
  Float32NDArray | Float64NDArray

export function is_NDArray(v: unknown): v is NDArray {
  return isObject(v) && (v as any).__ndarray__ == __ndarray__
}

export type NDArrayTypes = {
  "uint8":   {typed: Uint8Array,   ndarray: Uint8NDArray}
  "int8":    {typed: Int8Array,    ndarray: Int8NDArray}
  "uint16":  {typed: Uint16Array,  ndarray: Uint16NDArray}
  "int16":   {typed: Int16Array,   ndarray: Int16NDArray}
  "uint32":  {typed: Uint32Array,  ndarray: Uint32NDArray}
  "int32":   {typed: Int32Array,   ndarray: Int32NDArray}
  "float32": {typed: Float32Array, ndarray: Float32NDArray}
  "float64": {typed: Float64Array, ndarray: Float64NDArray}
}

export function ndarray<K extends DataType = "float64">(array: ArrayBuffer | number[], options?: {dtype?: K, shape?: number[]}): NDArrayTypes[K]["ndarray"]
export function ndarray<K extends DataType>(array: NDArrayTypes[K]["typed"], options?: {dtype?: K, shape?: number[]}): NDArrayTypes[K]["ndarray"]

export function ndarray(array: ArrayBuffer | TypedArray | number[], options: {dtype?: DataType, shape?: number[]} = {}): NDArray {
  let {dtype} = options
  if (dtype == null) {
    if (array instanceof ArrayBuffer || isArray(array)) {
      dtype = "float64"
    } else {
      dtype = (() => {
        switch (true) {
          case array instanceof Uint8Array:   return "uint8"
          case array instanceof Int8Array:    return "int8"
          case array instanceof Uint16Array:  return "uint16"
          case array instanceof Int16Array:   return "int16"
          case array instanceof Uint32Array:  return "uint32"
          case array instanceof Int32Array:   return "int32"
          case array instanceof Float32Array: return "float32"
          case array instanceof Float64Array: return "float64"
          default:
            unreachable()
        }
      })()
    }
  }
  const {shape} = options
  switch (dtype) {
    case "uint8":   return new Uint8NDArray(array, shape)
    case "int8":    return new Int8NDArray(array, shape)
    case "uint16":  return new Uint16NDArray(array, shape)
    case "int16":   return new Int16NDArray(array, shape)
    case "uint32":  return new Uint32NDArray(array, shape)
    case "int32":   return new Int32NDArray(array, shape)
    case "float32": return new Float32NDArray(array, shape)
    case "float64": return new Float64NDArray(array, shape)
  }
}
