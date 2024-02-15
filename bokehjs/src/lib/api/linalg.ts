export {keys, values, entries, size, extend} from "../core/util/object"
export * from "../core/util/array"
export * from "../core/util/string"
export * from "../core/util/random"
export * from "../core/util/types"
export * from "../core/util/eq"

import type {Arrayable} from "core/types"
import type {NDArrayType} from "core/util/ndarray"
import {is_NDArray, ndarray} from "core/util/ndarray"
import {isNumber, isArrayable} from "core/util/types"
import {range, linspace as _linspace} from "core/util/array"
import {map, sum as _sum, bin_counts} from "core/util/arrayable"
import {Random} from "core/util/random"
import {is_equal} from "core/util/eq"
import type {Floating} from "core/util/math"
import {float, is_Floating} from "core/util/math"
import * as math from "core/util/math"

export type Numerical<T = number> = number | Floating | Arrayable<T>

export function is_Numerical(x: unknown): x is Numerical {
  return isNumber(x) || is_Floating(x) || is_NDArray(x) || isArrayable(x)
}

export namespace np {
  export const pi: number = Math.PI

  export function arange(start: number, end?: number, step: number = 1): NDArrayType<number> {
    const array = range(start, end, step)
    return ndarray(array, {shape: [array.length], dtype: "float64"})
  }

  export function linspace(start: number, end: number, num: number = 100): NDArrayType<number> {
    const array = _linspace(start, end, num)
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
    return ndarray(r.buffer, {shape: [m], dtype: "float64"})
  }

  export function sin<T extends Numerical>(x: T): T
  export function sin(x: Numerical): Numerical {
    if (isNumber(x)) {
      return Math.sin(x)
    } else if (is_Floating(x)) {
      return Math.sin(x[float]())
    } else {
      return map(x, (v) => Math.sin(v))
    }
  }

  export function cos<T extends Numerical>(x: T): T
  export function cos(x: Numerical): Numerical {
    if (isNumber(x)) {
      return Math.cos(x)
    } else if (is_Floating(x)) {
      return Math.cos(x[float]())
    } else {
      return map(x, (v) => Math.cos(v))
    }
  }

  export function exp<T extends Numerical>(x: T): T
  export function exp(x: Numerical): Numerical {
    if (isNumber(x)) {
      return Math.exp(x)
    } else if (is_Floating(x)) {
      return Math.exp(x[float]())
    } else {
      return map(x, (v) => Math.exp(v))
    }
  }

  export function sqrt<T extends Numerical>(x: T): T
  export function sqrt(x: Numerical): Numerical {
    if (isNumber(x)) {
      return Math.sqrt(x)
    } else if (is_Floating(x)) {
      return Math.sqrt(x[float]())
    } else {
      return map(x, (v) => Math.sqrt(v))
    }
  }

  export function factorial<T extends Numerical>(x: T): T
  export function factorial(x: Numerical): Numerical {
    if (isNumber(x)) {
      return math.factorial(x)
    } else if (is_Floating(x)) {
      return math.factorial(x[float]())
    } else {
      return map(x, math.factorial)
    }
  }

  export function hermite(n: number): (x: Numerical) => Numerical {
    const poly = math.hermite(n)
    return (x) => {
      if (isNumber(x)) {
        return math.eval_poly(poly, x)
      } else if (is_Floating(x)) {
        return math.eval_poly(poly, x[float]())
      } else {
        return map(x, (v) => math.eval_poly(poly, v))
      }
    }
  }

  export function pos<T extends Numerical>(x: T): T
  export function pos(x: Numerical): Numerical {
    if (isNumber(x)) {
      return +x
    } else if (is_Floating(x)) {
      return +x[float]()
    } else {
      return map(x, (v) => +v)
    }
  }

  export function neg<T extends Numerical>(x: T): T
  export function neg(x: Numerical): Numerical {
    if (isNumber(x)) {
      return -x
    } else if (is_Floating(x)) {
      return -x[float]()
    } else {
      return map(x, (v) => -v)
    }
  }

  export function add(x0: number, y0: number): number
  export function add(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function add(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num) {
      return x + y
    } else if (x_num && !y_num) {
      return map(y, (yi) => x + yi)
    } else if (!x_num && y_num) {
      return map(x, (xi) => xi + y)
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => xi + y[i])
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  export function sub(x0: number, y0: number): number
  export function sub(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function sub(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num) {
      return x - y
    } else if (x_num && !y_num) {
      return map(y, (yi) => x - yi)
    } else if (!x_num && y_num) {
      return map(x, (xi) => xi - y)
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => xi - y[i])
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  export function mul(x0: number, y0: number): number
  export function mul(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function mul(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num) {
      return x * y
    } else if (x_num && !y_num) {
      return map(y, (yi) => x * yi)
    } else if (!x_num && y_num) {
      return map(x, (xi) => xi * y)
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => xi * y[i])
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  export function div(x0: number, y0: number): number
  export function div(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function div(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num) {
      return x / y
    } else if (x_num && !y_num) {
      return map(y, (yi) => x / yi)
    } else if (!x_num && y_num) {
      return map(x, (xi) => xi / y)
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => xi / y[i])
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  export function pow(x0: number, y0: number): number
  export function pow(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function pow(x0: Numerical, y0: Numerical): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    if (x_num && y_num) {
      return x ** y
    } else if (x_num && !y_num) {
      return map(y, (yi) => x ** yi)
    } else if (!x_num && y_num) {
      return map(x, (xi) => xi ** y)
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => xi ** y[i])
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  function cmp(x0: Numerical, y0: Numerical, op: (x: number, y: number) => boolean): Numerical {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    const int = (v: boolean) => v ? 1 : 0

    if (x_num && y_num) {
      return int(x >= y)
    } else if (x_num && !y_num) {
      return map(y, (yi) => int(op(x, yi)))
    } else if (!x_num && y_num) {
      return map(x, (xi) => int(op(xi, y)))
    } else if (is_NDArray(x) && is_NDArray(y)) {
      if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
        return map(x, (xi, i) => int(op(xi, y[i])))
      } else {
        throw new Error("shape or dtype mismatch")
      }
    } else {
      throw new Error("not implemented")
    }
  }

  export function ge(x0: number, y0: number): number
  export function ge(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function ge(x0: Numerical, y0: Numerical): Numerical {
    return cmp(x0, y0, (x, y) => x >= y)
  }

  export function le(x0: number, y0: number): number
  export function le(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function le(x0: Numerical, y0: Numerical): Numerical {
    return cmp(x0, y0, (x, y) => x <= y)
  }

  export function gt(x0: number, y0: number): number
  export function gt(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function gt(x0: Numerical, y0: Numerical): Numerical {
    return cmp(x0, y0, (x, y) => x > y)
  }

  export function lt(x0: number, y0: number): number
  export function lt(x0: Numerical, y0: Numerical): NDArrayType<number>
  export function lt(x0: Numerical, y0: Numerical): Numerical {
    return cmp(x0, y0, (x, y) => x < y)
  }

  export function where(condition: Arrayable<number>, x0: Numerical, y0: Numerical): Arrayable<number> {
    const x = is_Floating(x0) ? x0[float]() : x0
    const y = is_Floating(y0) ? y0[float]() : y0

    const x_num = isNumber(x)
    const y_num = isNumber(y)

    const fn = ((): (cond_i: number, i: number) => number => {
      if (x_num && y_num) {
        return (cond_i) => cond_i != 0 ? x : y
      } else if (x_num && !y_num) {
        return (cond_i, i) => cond_i != 0 ? x : y[i]
      } else if (!x_num && y_num) {
        return (cond_i, i) => cond_i != 0 ? x[i] : y
      } else if (is_NDArray(x) && is_NDArray(y)) {
        if (is_equal(x.shape, y.shape) && x.dtype == y.dtype) {
          return (cond_i, i) => cond_i != 0 ? x[i] : y[i]
        } else {
          throw new Error("shape or dtype mismatch")
        }
      } else {
        throw new Error("not implemented")
      }
    })()

    return map(condition, fn) // TODO: preserve ndarrays
  }

  type HistogramOptions = {density: boolean, bins: Arrayable<number>}

  export function histogram(array: Arrayable<number>, options: HistogramOptions): [NDArrayType<number>, NDArrayType<number>] {
    const {density, bins} = options
    const edges = ndarray(bins, {dtype: "float64", shape: [bins.length]})
    const hist = ndarray(bin_counts(array, edges), {dtype: "float64", shape: [edges.length - 1]})

    if (density) {
      const normed = div(div(hist, diff(edges)), sum(hist))
      return [normed, edges]
    } else {
      return [hist, edges]
    }
  }

  export namespace random {
    export class RandomGenerator {
      private _random: Random

      constructor(seed?: number) {
        this._random = new Random(seed ?? Date.now())
      }

      normal(loc: number, scale: number, size: number): NDArrayType<number> {
        const array = this._random.normals(loc, scale, size)
        return ndarray(array.buffer, {shape: [size], dtype: "float64"})
      }
    }

    export function default_rng(seed?: number): RandomGenerator {
      return new RandomGenerator(seed)
    }
  }
}
