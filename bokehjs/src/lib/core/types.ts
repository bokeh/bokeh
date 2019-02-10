export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type Anything = any

export type Color = string

export type TypedArray =
  Uint8Array   | Int8Array    |
  Uint16Array  | Int16Array   |
  Uint32Array  | Int32Array   |
  Float32Array | Float64Array

export type Arrayable<T = Anything> = {
  readonly length: number
  [n: number]: T
  [Symbol.iterator](): IterableIterator<T>
}

export type ArrayableOf<T> = T extends any ? Arrayable<T> : never

export type Data = {[key: string]: Arrayable<unknown>}

export type Size = {
  width: number
  height: number
}

export type Box = {
  left: number
  top: number
  width: number
  height: number
}

export type Rect = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type Area = {
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
