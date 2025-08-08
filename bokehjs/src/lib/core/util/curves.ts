import type {Rect} from "../types"
import {qbb, cbb} from "./algorithms"

const {atan2} = Math

abstract class ParametricCurve {

  abstract evaluate(t: number): [number, number]
  abstract derivative(t: number): [number, number]

  tangent(t: number) {
    const [dx, dy] = this.derivative(t)
    return atan2(dy, dx)
  }

  abstract bounding_box(): Rect
}

export class QuadraticBezier extends ParametricCurve {

  constructor(
    readonly x0: number, readonly y0: number,
    readonly x1: number, readonly y1: number,
    readonly cx0: number, readonly cy0: number,
  ) {
    super()
  }

  protected _evaluate(t: number, v0: number, v1: number, v2: number) {
    return (1 - t)**2*v0 + 2*(1 - t)*t*v1 + t**2*v2
  }

  evaluate(t: number): [number, number] {
    const {x0, cx0, x1} = this
    const {y0, cy0, y1} = this
    const x = this._evaluate(t, x0, cx0, x1)
    const y = this._evaluate(t, y0, cy0, y1)
    return [x, y]
  }

  protected _derivative(t: number, v0: number, v1: number, v2: number) {
    return 2*(1 - t)*(v1 - v0) + 2*t*(v2 - v1)
  }

  derivative(t: number): [number, number] {
    const {x0, cx0, x1} = this
    const {y0, cy0, y1} = this
    const dx = this._derivative(t, x0, cx0, x1)
    const dy = this._derivative(t, y0, cy0, y1)
    return [dx, dy]
  }

  bounding_box(): Rect {
    const {x0, cx0, x1} = this
    const {y0, cy0, y1} = this
    return qbb(x0, y0, cx0, cy0, x1, y1)
  }
}

export class CubicBezier extends ParametricCurve {

  constructor(
    readonly x0: number, readonly y0: number,
    readonly x1: number, readonly y1: number,
    readonly cx0: number, readonly cy0: number,
    readonly cx1: number, readonly cy1: number,
  ) {
    super()
  }

  protected _evaluate(t: number, v0: number, v1: number, v2: number, v3: number) {
    return (1 - t)**3*v0 + 3*(1 - t)**2*t*v1 + 3*(1 - t)*t**2*v2 + t**3*v3
  }

  evaluate(t: number): [number, number] {
    const {x0, cx0, cx1, x1} = this
    const {y0, cy0, cy1, y1} = this
    const x = this._evaluate(t, x0, cx0, cx1, x1)
    const y = this._evaluate(t, y0, cy0, cy1, y1)
    return [x, y]
  }

  protected _derivative(t: number, v0: number, v1: number, v2: number, v3: number) {
    return 3*(1 - t)**2*(v1 - v0) + 6*(1 - t)*t*(v2 - v1) + 3*t**2*(v3 - v2)
  }

  derivative(t: number): [number, number] {
    const {x0, cx0, cx1, x1} = this
    const {y0, cy0, cy1, y1} = this
    const dx = this._derivative(t, x0, cx0, cx1, x1)
    const dy = this._derivative(t, y0, cy0, cy1, y1)
    return [dx, dy]
  }

  bounding_box(): Rect {
    const {x0, cx0, cx1, x1} = this
    const {y0, cy0, cy1, y1} = this
    return cbb(x0, y0, cx0, cy0, cx1, cy1, x1, y1)
  }
}
