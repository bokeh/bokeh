import {Arrayable} from "../types"

const {sin, cos} = Math

export type Point = {x: number, y: number}
export type Rect = {p0: Point, p1: Point, p2: Point, p3: Point}

export class AffineTransform {

  constructor(
    private a: number = 1,
    private b: number = 0,
    private c: number = 0,
    private d: number = 1,
    private e: number = 0,
    private f: number = 0) {}

  toString(): string {
    const {a, b, c, d, e, f} = this
    return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`
  }

  clone(): AffineTransform {
    const {a, b, c, d, e, f} = this
    return new AffineTransform(a, b, c, d, e, f)
  }

  get is_identity(): boolean {
    const {a, b, c, d, e, f} = this
    return a == 1 && b == 0 && c == 0 && d == 1 && e == 0 && f == 0
  }

  apply_point(p: Point): Point {
    const [x, y] = this.apply(p.x, p.y)
    return {x, y}
  }

  apply_rect(rect: Rect): Rect {
    const p0 = this.apply_point(rect.p0)
    const p1 = this.apply_point(rect.p1)
    const p2 = this.apply_point(rect.p2)
    const p3 = this.apply_point(rect.p3)
    return {p0, p1, p2, p3}
  }

  apply(x: number, y: number): [number, number] {
    const {a, b, c, d, e, f} = this
    return [
      a*x + c*y + e,
      b*x + d*y + f,
    ]
  }

  iv_apply(xs: Arrayable<number>, ys: Arrayable<number>): void {
    const {a, b, c, d, e, f} = this
    const n = xs.length

    for (let i = 0; i < n; i++) {
      const x = xs[i]
      const y = ys[i]
      xs[i] = a*x + c*y + e
      ys[i] = b*x + d*y + f
    }
  }

  transform(A: number, B: number, C: number, D: number, E: number, F: number): this {
    const {a, b, c, d, e, f} = this
    this.a = a*A + c*B
    this.c = a*C + c*D
    this.e = a*E + c*F + e
    this.b = b*A + d*B
    this.d = b*C + d*D
    this.f = b*E + d*F + f
    return this
  }

  translate(tx: number, ty: number): this {
    return this.transform(1, 0, 0, 1, tx, ty)
  }

  scale(cx: number, cy: number): this {
    return this.transform(cx, 0, 0, cy, 0, 0)
  }

  skew(sx: number, sy: number): this {
    return this.transform(1, sy, sx, 1, 0, 0)
  }

  rotate(angle: number): this {
    const s = sin(angle)
    const c = cos(angle)
    return this.transform(c, s, -s, c, 0, 0)
  }

  rotate_ccw(angle: number): this {
    return this.rotate(-angle)
  }

  translate_x(tx: number): this {
    return this.translate(tx, 0)
  }

  translate_y(ty: number): this {
    return this.translate(0, ty)
  }

  flip(): this {
    return this.scale(-1, -1)
  }

  flip_x(): this {
    return this.scale(1, -1)
  }

  flip_y(): this {
    return this.scale(-1, 1)
  }
}
