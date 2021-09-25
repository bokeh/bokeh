export {keys, values, entries, size, extend} from "../core/util/object"
export * from "../core/util/array"
export * from "../core/util/string"
export * from "../core/util/random"
export * from "../core/util/types"
export * from "../core/util/eq"

import {Arrayable} from "core/types"
import {NDArray, is_NDArray, ndarray} from "core/util/ndarray"
import {isNumber} from "core/util/types"
import {range, linspace as _linspace} from "core/util/array"
import {map, sum as _sum, bin_counts} from "core/util/arrayable"
import {Random} from "core/util/random"
import {is_equal} from "core/util/eq"

type Numerical = number | Arrayable<number>

export namespace np {
  export const pi: number = Math.PI

  export function arange(start: number, end?: number, step: number = 1): NDArray {
    const array = range(start, end, step)
    return ndarray(array, {shape: [array.length], dtype: "float64"})
  }

  export function linspace(start: number, end: number, step: number): NDArray {
    const array = _linspace(start, end, step)
    return ndarray(array, {shape: [array.length], dtype: "float64"})
  }

  export function mean(x: Arrayable<number>): number {
    return sum(x)/x.length
  }

  export function std(x: Arrayable<number>): number {
    const mu = mean(x)
    return Math.sqrt(sum(map(x, (xi) => (xi - mu)**2))/x.length)
  }

  export function sum(x: Arrayable<number>): number {
    return _sum(x)
  }

  export function diff<T extends Arrayable<number>>(x: T): T
  export function diff(x: Arrayable<number>): Arrayable<number> {
    const m = x.length - 1
    const r = new Float64Array(m)
    for (let i = 0; i < m; i++) {
      r[i] = x[i + 1] - x[i]
    }
    return ndarray(r.buffer, {shape: [m]})
  }

  export function exp<T extends Numerical>(x: T): T
  export function exp(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.exp(x)
    else
      return map(x, (v) => Math.exp(v))
  }

  export function sqrt<T extends Numerical>(x: T): T
  export function sqrt(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.sqrt(x)
    else
      return map(x, (v) => Math.sqrt(v))
  }

  export function pos<T extends Numerical>(x: T): T
  export function pos(x: Numerical): Numerical {
    if (isNumber(x))
      return +x
    else
      return map(x, (v) => +v)
  }

  export function neg<T extends Numerical>(x: T): T
  export function neg(x: Numerical): Numerical {
    if (isNumber(x))
      return -x
    else
      return map(x, (v) => -v)
  }

  export function add(x: number, y: number): number
  export function add(x: Numerical, y: Numerical): NDArray
  export function add(x: Numerical, y: Numerical): Numerical {
    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num)
      return x + y
    else if (x_num && !y_num)
      return map(y, (yi) => x + yi)
    else if (!x_num && y_num)
      return map(x, (xi) => xi + y)
    else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype)
        return map(x, (xi, i) => xi + y[i])
      else
        throw new Error("shape or dtype mismatch")
    } else
      throw new Error("not implemented")
  }

  export function sub(x: number, y: number): number
  export function sub(x: Numerical, y: Numerical): NDArray
  export function sub(x: Numerical, y: Numerical): Numerical {
    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num)
      return x - y
    else if (x_num && !y_num)
      return map(y, (yi) => x - yi)
    else if (!x_num && y_num)
      return map(x, (xi) => xi - y)
    else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype)
        return map(x, (xi, i) => xi - y[i])
      else
        throw new Error("shape or dtype mismatch")
    } else
      throw new Error("not implemented")
  }

  export function mul(x: number, y: number): number
  export function mul(x: Numerical, y: Numerical): NDArray
  export function mul(x: Numerical, y: Numerical): Numerical {
    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num)
      return x * y
    else if (x_num && !y_num)
      return map(y, (yi) => x * yi)
    else if (!x_num && y_num)
      return map(x, (xi) => xi * y)
    else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype)
        return map(x, (xi, i) => xi * y[i])
      else
        throw new Error("shape or dtype mismatch")
    } else
      throw new Error("not implemented")
  }

  export function div(x: number, y: number): number
  export function div(x: Numerical, y: Numerical): NDArray
  export function div(x: Numerical, y: Numerical): Numerical {
    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num)
      return x / y
    else if (x_num && !y_num)
      return map(y, (yi) => x / yi)
    else if (!x_num && y_num)
      return map(x, (xi) => xi / y)
    else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype)
        return map(x, (xi, i) => xi / y[i])
      else
        throw new Error("shape or dtype mismatch")
    } else
      throw new Error("not implemented")
  }

  export function pow(x: number, y: number): number
  export function pow(x: Numerical, y: Numerical): NDArray
  export function pow(x: Numerical, y: Numerical): Numerical {
    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num)
      return x ** y
    else if (x_num && !y_num)
      return map(y, (yi) => x ** yi)
    else if (!x_num && y_num)
      return map(x, (xi) => xi ** y)
    else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype)
        return map(x, (xi, i) => xi ** y[i])
      else
        throw new Error("shape or dtype mismatch")
    } else
      throw new Error("not implemented")
  }

  type HistogramOptions = {density: boolean, bins: Arrayable<number>}

  export function histogram(array: Arrayable<number>, options: HistogramOptions): [NDArray, NDArray] {
    const {density, bins} = options
    const edges = ndarray(bins, {dtype: "float64", shape: [bins.length]})
    const hist = ndarray(bin_counts(array, edges), {dtype: "float64", shape: [edges.length - 1]})

    if (density) {
      const normed = div(div(hist, diff(edges)), sum(hist))
      return [normed, edges]
    } else
      return [hist, edges]
  }

  export namespace random {
    export class RandomGenerator {
      private _random: Random

      constructor(seed?: number) {
        this._random = new Random(seed ?? Date.now())
      }

      normal(loc: number, scale: number, size: number): NDArray {
        const array = new Float64Array(size)

        const [mu, sigma] = [loc, scale]
        const c = 1/Math.sqrt(2*np.pi*sigma**2)

        for (let i = 0; i < size; i++) {
          const x = this._random.float()
          array[i] = c*Math.exp((x - mu)**2/(2*sigma**2))
        }

        return ndarray(array.buffer, {shape: [size], dtype: "float64"})
      }
    }

    export function default_rng(seed?: number): RandomGenerator {
      return new RandomGenerator(seed)
    }
  }
}
