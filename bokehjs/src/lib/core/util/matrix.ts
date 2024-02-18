import {min} from "./array"

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

  *[Symbol.iterator](): Iterator<[T, number, number]> {
    for (let y = 0; y < this.nrows; y++) {
      for (let x = 0; x < this.ncols; x++) {
        const value = this._matrix[y][x]
        if (value !== undefined) {
          yield [value, y, x]
        }
      }
    }
  }

  *values(): Iterable<T> {
    for (const [item] of this) {
      yield item
    }
  }

  map<U>(fn: Matrix.MapFn<T, U>): Matrix<U> {
    return new Matrix<U>(this.nrows, this.ncols, (row, col) => fn(this.at(row, col), row, col))
  }

  apply<U>(obj: Matrix<Matrix.MapFn<T, U>> | Matrix.MapFn<T, U>[][]): Matrix<U> {
    const fn = Matrix.from(obj)

    const {nrows, ncols} = this
    if (nrows == fn.nrows && ncols == fn.ncols) {
      return new Matrix(nrows, ncols, (row, col) => fn.at(row, col)(this.at(row, col), row, col))
    } else {
      throw new Error("dimensions don't match")
    }
  }

  to_sparse(): [T, number, number][] {
    return [...this]
  }

  static from<U>(obj: U[], ncols: number): Matrix<U>
  static from<U>(obj: Matrix<U> | U[][]): Matrix<U>

  static from<U>(obj: Matrix<U> | U[][] | U[], ncols?: number): Matrix<U> {
    if (obj instanceof Matrix) {
      return obj
    } else if (ncols != null) {
      const entries = obj as U[]
      const nrows = Math.ceil(entries.length/ncols)
      return new Matrix(nrows, ncols, (row, col) => entries[row*ncols + col])
    } else {
      const arrays = obj as U[][]
      const nrows = obj.length
      const ncols = min(arrays.map((row) => row.length))
      return new Matrix(nrows, ncols, (row, col) => arrays[row][col])
    }
  }
}
