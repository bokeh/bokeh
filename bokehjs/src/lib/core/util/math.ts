import {AngleUnits} from "../enums"
import {isObject} from "./types"
import {assert} from "./assert"

const {PI, abs, floor, ceil, sign, min, max} = Math
export {PI as pi, abs, floor, ceil, sign, min, max}

export function absmin(a: number, b: number): number {
  return abs(a) <= abs(b) ? a : b
}

export function absmax(a: number, b: number): number {
  return abs(a) >= abs(b) ? a : b
}

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

export function random(): number {
  return Math.random()
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

export function compute_angle(angle: number, units: AngleUnits): number {
  /** Convert CCW angle with units to CW radians (canvas). */
  return -to_radians_coeff(units)*angle
}

export const resolve_angle = compute_angle

export function to_radians_coeff(units: AngleUnits): number {
  switch (units) {
    case "deg":  return PI/180
    case "rad":  return 1
    case "grad": return PI/200
    case "turn": return 2*PI
  }
}

// http://www2.econ.osaka-u.ac.jp/~tanizaki/class/2013/econome3/13.pdf (Page 432)
export function rnorm(mu: number, sigma: number): number {
  // Generate a random normal with a mean of 0 and a sigma of 1
  let r1: number
  let r2: number
  while (true) {
    r1 = random()
    r2 = random()
    r2 = (2*r2-1)*Math.sqrt(2*(1/Math.E))
    if (-4*r1*r1*Math.log(r1) >= r2*r2)
      break
  }
  let rn = r2/r1

  // Transform the standard normal to meet the characteristics that we want (mu, sigma)
  rn = mu + sigma*rn

  return rn
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
