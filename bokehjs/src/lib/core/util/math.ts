import {AngleUnits, Direction} from "../enums"
import {Rect} from "../types"
import {isObject} from "./types"
import {assert} from "./assert"
import {minmax} from "./arrayable"

const {PI, abs, sign, sqrt} = Math

export function angle_norm(angle: number): number {
  if (angle == 0) {
    return 0
  }
  while (angle <= 0) {
    angle += 2*PI
  }
  while (angle > 2*PI) {
    angle -= 2*PI
  }
  return angle
}

export function angle_dist(lhs: number, rhs: number): number {
  return angle_norm(lhs-rhs)
}

export function angle_between(mid: number, lhs: number, rhs: number, anticlock: boolean = false): boolean {
  const d = angle_dist(lhs, rhs)
  if (d == 0)
    return false
  if (d == 2*PI)
    return true
  const norm_mid = angle_norm(mid)
  const cond = angle_dist(lhs, norm_mid) <= d && angle_dist(norm_mid, rhs) <= d
  return !anticlock ? cond : !cond
}

export function randomIn(min: number, max?: number): number {
  if (max == null) {
    max = min
    min = 0
  }

  return min + Math.floor(Math.random()*(max - min + 1))
}

export function atan2(start: [number, number], end: [number, number]): number {
  /*
   * Calculate the angle between a line containing start and end points (composed
   * of [x, y] arrays) and the positive x-axis.
   */
  return Math.atan2(end[1] - start[1], end[0] - start[0])
}

export function radians(degrees: number): number {
  return degrees*(PI/180)
}

export function degrees(radians: number): number {
  return radians/(PI/180)
}

export function compute_angle(angle: number, units: AngleUnits, dir: Direction = "anticlock"): number {
  /**
   * Convert math CCW(default)/CW angle with units to CW radians (canvas).
   */
  const sign = dir == "anticlock" ? 1 : -1
  return -sign*angle*to_radians_coeff(units)
}

export function invert_angle(angle: number, units: AngleUnits, dir: Direction = "anticlock"): number {
  /**
   * Convert CW radians (canvas) to math CCW(default)/CW angle with units.
   */
  const sign = dir == "anticlock" ? 1 : -1
  return -sign*angle/to_radians_coeff(units)
}

export function to_radians_coeff(units: AngleUnits): number {
  switch (units) {
    case "deg":  return PI/180
    case "rad":  return 1
    case "grad": return PI/200
    case "turn": return 2*PI
  }
}

export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : (val > max ? max : val)
}

export function log(x: number, base: number = Math.E): number {
  return Math.log(x)/Math.log(base)
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)

  while (b != 0) {
    [a, b] = [b, a % b]
  }

  return a
}

export function lcm(a: number, ...rest: number[]): number {
  for (const b of rest) {
    a = Math.floor((a*b) / gcd(a, b))
  }

  return a
}

export const float = Symbol("float")

export interface Floating {
  [float](): number
}

export function is_Floating<T>(obj: T): obj is T & Floating {
  return isObject(obj) && float in obj
}

export class Fraction implements Floating {
  readonly numer: number
  readonly denom: number

  constructor(numer: number, denom: number) {
    assert(denom != 0, "Zero divisor")
    const div = gcd(numer, denom)
    const sgn = sign(numer)*sign(denom)
    this.numer = sgn*abs(numer)/div
    this.denom = abs(denom)/div
  }

  [float](): number {
    return this.numer/this.denom
  }

  toString(): string {
    return `${this.numer}/${this.denom}`
  }
}

export const float32_epsilon = 1.1920928955078125e-7  // IEEE-754

export function factorial(x: number): number {
  let y = 1
  for (let i = 2; i <= x; i++) {
    y *= i
  }
  return y
}

type Poly = number[]

export function hermite(n: number): Poly {
  const poly = new Array(n + 1)
  poly.fill(0)
  const fn = factorial(n)
  for (let k = 0; k <= Math.floor(n/2); k++) {
    const c = (-1)**k*fn / (factorial(k)*factorial(n - 2*k)) * 2**(n - 2*k)
    poly[2*k] = c
  }
  return poly
}

export function eval_poly(poly: Poly, x: number): number {
  const n = poly.length - 1
  let y = 0
  let x_n = 1
  for (let i = n; i >= 0; i--) {
    y += x_n*poly[i]
    x_n *= x
  }
  return y
}

/**
 * Formula from: http://pomax.nihongoresources.com/pages/bezier/
 *
 * if segment is quadratic bezier do:
 *   for both directions do:
 *     if control between start and end, compute linear bounding box
 *     otherwise, compute
 *       bound = u(1-t)^2 + 2v(1-t)t + wt^2
 *         (with t = ((u-v) / (u-2v+w)), with {u = start, v = control, w = end})
 *       if control precedes start, min = bound, otherwise max = bound
 */

export function qbb(
    x0: number, y0: number,
    x1: number, y1: number,
    cx: number, cy: number): Rect {

  function _qbb(u: number, v: number, w: number): [number, number] {
    if (v == (u + w)/2)
      return [u, w]
    else {
      const t = (u - v) / (u - 2*v + w)
      const bd = u*(1 - t)**2 + 2*v*(1 - t)*t + w*t**2
      return [Math.min(u, w, bd), Math.max(u, w, bd)]
    }
  }

  const [x_min, x_max] = _qbb(x0, cx, x1)
  const [y_min, y_max] = _qbb(y0, cy, y1)

  return {
    x0: x_min, x1: x_max,
    y0: y_min, y1: y_max,
  }
}

// algorithm adapted from http://stackoverflow.com/a/14429749/3406693
export function cbb(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number): Rect {
  const tvalues: number[] = []

  const x_bounds: number[] = []
  const y_bounds: number[] = []

  for (let i = 0; i <= 2; i++) {
    let a, b, c
    if (i == 0) {
      b = 6*x0 - 12*x1 + 6*x2
      a = -3*x0 + 9*x1 - 9*x2 + 3*x3
      c = 3*x1 - 3*x0
    } else {
      b = 6*y0 - 12*y1 + 6*y2
      a = -3*y0 + 9*y1 - 9*y2 + 3*y3
      c = 3*y1 - 3*y0
    }

    if (abs(a) < 1e-12) { // Numerical robustness
      if (abs(b) < 1e-12) // Numerical robustness
        continue
      const t = -c / b
      if (0 < t && t < 1)
        tvalues.push(t)
      continue
    }

    const b2ac = b**2 - 4*c*a
    const sqrtb2ac = sqrt(b2ac)

    if (b2ac < 0)
      continue

    const t1 = (-b + sqrtb2ac) / (2*a)
    if (0 < t1 && t1 < 1)
      tvalues.push(t1)

    const t2 = (-b - sqrtb2ac) / (2*a)
    if (0 < t2 && t2 < 1)
      tvalues.push(t2)
  }

  let j = tvalues.length
  const jlen = j
  while (j--) {
    const t = tvalues[j]
    const mt = 1 - t

    const x = mt**3*x0 + 3*mt**2*t*x1 + 3*mt*t**2*x2 + t**3*x3
    const y = mt**3*y0 + 3*mt**2*t*y1 + 3*mt*t**2*y2 + t**3*y3

    x_bounds[j] = x
    y_bounds[j] = y
  }

  x_bounds[jlen] = x0
  x_bounds[jlen + 1] = x3
  y_bounds[jlen] = y0
  y_bounds[jlen + 1] = y3

  const [x_min, x_max] = minmax(x_bounds)
  const [y_min, y_max] = minmax(y_bounds)
  return {
    x0: x_min,
    x1: x_max,
    y0: y_max,
    y1: y_min,
  }
}
