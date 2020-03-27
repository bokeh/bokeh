import {difference, copy, min} from "./array"
import {isEqual} from "./eq"
import {isArray} from "./types"

export class MultiDict<T> {

  _dict: {[key: string]: T | T[]} = {}

  _existing(key: string): T | T[] | null {
    if (key in this._dict)
      return this._dict[key]
    else
      return null
  }

  add_value(key: string, value: T): void {
    /*
    if value == null
      throw new Error("Can't put null in this dict")
    if isArray(value)
      throw new Error("Can't put arrays in this dict")
    */
    const existing = this._existing(key)
    if (existing == null) {
      this._dict[key] = value
    } else if (isArray(existing)) {
      existing.push(value)
    } else {
      this._dict[key] = [existing, value]
    }
  }

  remove_value(key: string, value: T): void {
    const existing = this._existing(key)
    if (isArray(existing)) {
      const new_array = difference(existing, [value])
      if (new_array.length > 0)
        this._dict[key] = new_array
      else
        delete this._dict[key]
    } else if (isEqual(existing, value)) {
      delete this._dict[key]
    }
  }

  get_one(key: string, duplicate_error: string): T | null {
    const existing = this._existing(key)
    if (isArray(existing)) {
      if (existing.length === 1)
        return existing[0]
      else
        throw new Error(duplicate_error)
    } else
      return existing
  }
}

export class Set<T> {

  private _values: T[]

  get values(): T[] {
    return copy(this._values).sort()
  }

  constructor(obj?: Iterable<T> | Set<T>) {
    if (obj == null)
      this._values = []
    else if (obj instanceof Set)
      this._values = copy(obj._values)
    else {
      this._values = []
      for (const item of obj)
        this.add(item)
    }
  }

  toString(): string {
    return `Set([${this.values.join(",")}])`
  }

  get size(): number {
    return this._values.length
  }

  has(item: T): boolean {
    return this._values.indexOf(item) !== -1
  }

  add(item: T): void {
    if (!this.has(item))
      this._values.push(item)
  }

  remove(item: T): void {
    const i = this._values.indexOf(item)
    if (i !== -1)
      this._values.splice(i, 1)
  }

  toggle(item: T): void {
    const i = this._values.indexOf(item)
    if (i === -1)
      this._values.push(item)
    else
      this._values.splice(i, 1)
  }

  clear(): void {
    this._values = []
  }

  union(input: T[] | Set<T>): Set<T> {
    input = new Set<T>(input)
    return new Set(this._values.concat(input._values))
  }

  intersect(input: T[] | Set<T>): Set<T> {
    input = new Set<T>(input)
    const output = new Set<T>()

    for (const item of input._values) {
      if (this.has(item) && input.has(item))
        output.add(item)
    }

    return output
  }

  diff(input: T[] | Set<T>): Set<T> {
    input = new Set<T>(input)
    const output = new Set<T>()

    for (const item of this._values) {
      if (!input.has(item))
        output.add(item)
    }

    return output
  }

  forEach(fn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
    for (const value of this._values) {
      fn.call(thisArg || this, value, value, this)
    }
  }
}

export namespace Matrix {
  export type MapFn<T, U> = (value: T, row: number, col: number) => U
}

export class Matrix<T> {
  private _matrix: T[][]

  constructor(readonly nrows: number, readonly ncols: number, init: (row: number, col: number) => T) {
    this._matrix = new Array(nrows)
    for (let y = 0; y < nrows; y++) {
      this._matrix[y] = new Array(ncols)
      for (let x = 0; x < ncols; x++) {
        this._matrix[y][x] = init(y, x)
      }
    }
  }

  at(row: number, col: number): T {
    return this._matrix[row][col]
  }

  map<U>(fn: Matrix.MapFn<T, U>): Matrix<U> {
    return new Matrix<U>(this.nrows, this.ncols, (row, col) => fn(this.at(row, col), row, col))
  }

  apply<U>(obj: Matrix<Matrix.MapFn<T, U>> | Matrix.MapFn<T, U>[][]): Matrix<U> {
    const fn = Matrix.from(obj)

    const {nrows, ncols} = this
    if (nrows == fn.nrows && ncols == fn.ncols)
      return new Matrix(nrows, ncols, (row, col) => fn.at(row, col)(this.at(row, col), row, col))
    else
      throw new Error("dimensions don't match")
  }

  to_sparse(): [T, number, number][] {
    const items: [T, number, number][] = []

    for (let y = 0; y < this.nrows; y++) {
      for (let x = 0; x < this.ncols; x++) {
        const value = this._matrix[y][x]
        items.push([value, y, x])
      }
    }

    return items
  }

  static from<U>(obj: Matrix<U> | U[][]): Matrix<U> {
    if (obj instanceof Matrix)
      return obj
    else {
      const nrows = obj.length
      const ncols = min(obj.map((row) => row.length))
      return new Matrix(nrows, ncols, (row, col) => obj[row][col])
    }
  }
}
