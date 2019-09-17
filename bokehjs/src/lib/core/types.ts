export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type Color = string

export type TypedArray =
  Uint8Array   | Int8Array    |
  Uint16Array  | Int16Array   |
  Uint32Array  | Int32Array   |
  Float32Array | Float64Array

export type Arrayable<T = any> = {
  readonly length: number
  [n: number]: T
  [Symbol.iterator](): IterableIterator<T>
  // TODO: constructor: ArrayableNew
}

export type ArrayableNew = {new <T>(n: number): Arrayable<T>}

export type ArrayableOf<T> = T extends unknown ? Arrayable<T> : never

export type Data = {[key: string]: Arrayable<unknown>}

export type Attrs = {[key: string]: unknown}

export type Size = {
  width: number
  height: number
}

export type Box = {
  x: number
  y: number
  width: number
  height: number
}

export type Rect = {
  x0: number
  y0: number
  x1: number
  y1: number
}

export type Extents = {
  left: number
  top: number
  right: number
  bottom: number
}

export type Interval = {
  start: number
  end: number
}
