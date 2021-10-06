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
import {float, Floating, is_Floating} from "core/util/math"

export type Numerical = number | Floating | Arrayable<number>

export function is_Numerical(x: unknown): x is Numerical {
  return isNumber(x) || is_Floating(x) || is_NDArray(x)
}

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

  export function sin<T extends Numerical>(x: T): T
  export function sin(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.sin(x)
    else if (is_Floating(x))
      return Math.sin(x[float]())
    else
      return map(x, (v) => Math.sin(v))
  }

  export function cos<T extends Numerical>(x: T): T
  export function cos(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.cos(x)
    else if (is_Floating(x))
      return Math.cos(x[float]())
    else
      return map(x, (v) => Math.cos(v))
  }

  export function exp<T extends Numerical>(x: T): T
  export function exp(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.exp(x)
    else if (is_Floating(x))
      return Math.exp(x[float]())
    else
      return map(x, (v) => Math.exp(v))
  }

  export function sqrt<T extends Numerical>(x: T): T
  export function sqrt(x: Numerical): Numerical {
    if (isNumber(x))
      return Math.sqrt(x)
    else if (is_Floating(x))
      return Math.sqrt(x[float]())
    else
      return map(x, (v) => Math.sqrt(v))
  }

  export function pos<T extends Numerical>(x: T): T
  export function pos(x: Numerical): Numerical {
    if (isNumber(x))
      return +x
    else if (is_Floating(x))
      return +x[float]()
    else
      return map(x, (v) => +v)
  }

  export function neg<T extends Numerical>(x: T): T
  export function neg(x: Numerical): Numerical {
    if (isNumber(x))
      return -x
    else if (is_Floating(x))
      return -x[float]()
    else
      return map(x, (v) => -v)
  }

  export function add(x0: number, y0: number): number
  export function add(x0: Numerical, y0: Numerical): NDArray
  export function add(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

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

  export function sub(x0: number, y0: number): number
  export function sub(x0: Numerical, y0: Numerical): NDArray
  export function sub(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

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

  export function mul(x0: number, y0: number): number
  export function mul(x0: Numerical, y0: Numerical): NDArray
  export function mul(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

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

  export function div(x0: number, y0: number): number
  export function div(x0: Numerical, y0: Numerical): NDArray
  export function div(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

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

  export function pow(x0: number, y0: number): number
  export function pow(x0: Numerical, y0: Numerical): NDArray
  export function pow(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

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

        for (let i = 0; i < size; i += 2) {
          // Box-Muller transform from uniform to normal distribution.
          const u = this._random.float()
          const v = this._random.float()
          const common = Math.sqrt(-2.0*Math.log(u))
          array[i] = mu + sigma*(common*Math.cos(2.0*np.pi*v))
          if (i+1 < size)
            array[i+1] = mu + sigma*(common*Math.sin(2.0*np.pi*v))
        }

        return ndarray(array.buffer, {shape: [size], dtype: "float64"})
      }
    }

    export function default_rng(seed?: number): RandomGenerator {
      return new RandomGenerator(seed)
    }
  }
}
