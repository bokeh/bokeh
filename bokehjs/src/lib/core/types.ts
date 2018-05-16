export type Anything = any

export type Color = string

export type TypedArray =
  Uint8Array   | Int8Array    |
  Uint16Array  | Int16Array   |
  Uint32Array  | Int32Array   |
  Float32Array | Float64Array

export interface Arrayable<T = Anything> {
  readonly length: number
  [n: number]: T
}
