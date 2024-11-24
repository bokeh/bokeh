import type {MarkerType} from "core/enums"
import type {LineVector, FillVector, HatchVector} from "core/visuals"
import type {Context2d} from "core/util/canvas"

export type VectorVisuals = {line: LineVector, fill: FillVector, hatch: HatchVector}

const SQ3 = Math.sqrt(3)
const SQ5 = Math.sqrt(5)
const c36 = (SQ5+1)/4
const s36 = Math.sqrt((5-SQ5)/8)
const c72 = (SQ5-1)/4
const s72 = Math.sqrt((5+SQ5)/8)

function _one_line(ctx: Context2d, r: number): void {
  ctx.moveTo(-r,  0)
  ctx.lineTo(r,  0)
}

function _one_x(ctx: Context2d, r: number): void {
  ctx.rotate(Math.PI/4)
  _one_cross(ctx, r)
  ctx.rotate(-Math.PI/4)
}

function _one_y(ctx: Context2d, r: number): void {
  const h = r*SQ3
  const a = h/3

  ctx.moveTo(-h/2, -a)
  ctx.lineTo(0, 0)
  ctx.lineTo(h/2, -a)
  ctx.lineTo(0, 0)
  ctx.lineTo(0, r)
}

function _one_cross(ctx: Context2d, r: number): void {
  ctx.moveTo(0,  r)
  ctx.lineTo(0, -r)
  ctx.moveTo(-r,  0)
  ctx.lineTo(r,  0)
}

function _one_dot(ctx: Context2d, r: number): void {
  ctx.beginPath()
  ctx.arc(0, 0, r/4, 0, 2*Math.PI, false)
  ctx.closePath()
}

function _one_diamond(ctx: Context2d, r: number): void {
  ctx.moveTo(0, r)
  ctx.lineTo(r/1.5, 0)
  ctx.lineTo(0, -r)
  ctx.lineTo(-r/1.5, 0)
  ctx.closePath()
}

function _one_hex(ctx: Context2d, r: number): void {
  const r2 = r/2
  const h = SQ3*r2

  ctx.moveTo(r,   0)
  ctx.lineTo(r2, -h)
  ctx.lineTo(-r2, -h)
  ctx.lineTo(-r,   0)
  ctx.lineTo(-r2,  h)
  ctx.lineTo(r2,  h)
  ctx.closePath()
}

function _one_star(ctx: Context2d, r: number): void {
  const a = Math.sqrt(5-2*SQ5)*r

  ctx.moveTo(0, -r)
  ctx.lineTo(a*c72, -r+a*s72)
  ctx.lineTo(a*(1+c72), -r+a*s72)
  ctx.lineTo(a*(1+c72-c36), -r+a*(s72+s36))
  ctx.lineTo(a*(1+2*c72-c36), -r+a*(2*s72+s36))
  ctx.lineTo(0, -r+a*2*s72)
  ctx.lineTo(-a*(1+2*c72-c36), -r+a*(2*s72+s36))
  ctx.lineTo(-a*(1+c72-c36), -r+a*(s72+s36))
  ctx.lineTo(-a*(1+c72), -r+a*s72)
  ctx.lineTo(-a*c72, -r+a*s72)
  ctx.closePath()
}

function _one_tri(ctx: Context2d, r: number): void {
  const h = r*SQ3
  const a = h/3

  ctx.moveTo(-r, a)
  ctx.lineTo(r, a)
  ctx.lineTo(0, a-h)
  ctx.closePath()
}

function asterisk(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_cross(ctx, r)
  _one_x(ctx, r)

  visuals.line.apply(ctx, i)
}

function circle(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function circle_cross(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  _one_cross(ctx, r)
  visuals.line.apply(ctx, i)
}

function circle_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  circle(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function circle_y(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  _one_y(ctx, r)
  visuals.line.apply(ctx, i)
}

function circle_x(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  _one_x(ctx, r)
  visuals.line.apply(ctx, i)
}

function cross(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_cross(ctx, r)

  visuals.line.apply(ctx, i)
}

function diamond(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_diamond(ctx, r)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function diamond_cross(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_diamond(ctx, r)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  ctx.moveTo(0,  r)
  ctx.lineTo(0, -r)
  ctx.moveTo(-r/1.5,  0)
  ctx.lineTo(r/1.5,  0)
  visuals.line.apply(ctx, i)
}

function diamond_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  diamond(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_dot(ctx, r)

  visuals.line.set_vectorize(ctx, i)
  ctx.fillStyle = ctx.strokeStyle // NOTE: dots use line color for fill to match
  ctx.fill()
}

function hex(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_hex(ctx, r)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function hex_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  hex(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function inverted_triangle(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  ctx.rotate(Math.PI)
  _one_tri(ctx, r)
  ctx.rotate(-Math.PI)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function plus(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const a = 3*r/8
  const b = r
  const xs = [a, a, b,  b,  a,  a, -a, -a, -b, -b, -a, -a]
  const ys = [b, a, a, -a, -a, -b, -b, -a, -a,  a,  a,  b]

  ctx.beginPath()
  for (let j = 0; j < 12; j++) {
    ctx.lineTo(xs[j], ys[j])
  }
  ctx.closePath()

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function square(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function square_pin(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const a = 3*r/8

  ctx.moveTo(-r, -r)
  /* eslint-disable space-in-parens */
  ctx.quadraticCurveTo( 0, -a,  r, -r)
  ctx.quadraticCurveTo( a,  0,  r,  r)
  ctx.quadraticCurveTo( 0,  a, -r,  r)
  ctx.quadraticCurveTo(-a,  0, -r, -r)
  /* eslint-enable space-in-parens */

  ctx.closePath()

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function square_cross(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  _one_cross(ctx, r)
  visuals.line.apply(ctx, i)
}

function square_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  square(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function square_x(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)

  ctx.moveTo(-r,  r)
  ctx.lineTo(r, -r)
  ctx.moveTo(-r, -r)
  ctx.lineTo(r,  r)
  visuals.line.apply(ctx, i)
}

function star(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_star(ctx, r)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function star_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  star(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function triangle(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_tri(ctx, r)

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function triangle_dot(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  triangle(ctx, i, r, visuals)
  dot(ctx, i, r, visuals)
}

function triangle_pin(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  const h = r*SQ3
  const a = h/3
  const b = 3*a/8

  ctx.moveTo(-r, a)
  ctx.quadraticCurveTo(0, b,  r, a)
  ctx.quadraticCurveTo(SQ3*b/2, b/2,  0, a-h)
  ctx.quadraticCurveTo(-SQ3*b/2, b/2, -r, a)
  ctx.closePath()

  visuals.fill.apply(ctx, i)
  visuals.hatch.apply(ctx, i)
  visuals.line.apply(ctx, i)
}

function dash(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_line(ctx, r)
  visuals.line.apply(ctx, i)
}

function x(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_x(ctx, r)
  visuals.line.apply(ctx, i)
}

function y(ctx: Context2d, i: number, r: number, visuals: VectorVisuals): void {
  _one_y(ctx, r)
  visuals.line.apply(ctx, i)
}

export type RenderOne = (ctx: Context2d, i: number, r: number, visuals: VectorVisuals) => void

export const marker_funcs = {
  asterisk,
  circle,
  circle_cross,
  circle_dot,
  circle_y,
  circle_x,
  cross,
  diamond,
  diamond_dot,
  diamond_cross,
  dot,
  hex,
  hex_dot,
  inverted_triangle,
  plus,
  square,
  square_cross,
  square_dot,
  square_pin,
  square_x,
  star,
  star_dot,
  triangle,
  triangle_dot,
  triangle_pin,
  dash,
  x,
  y,
} satisfies {[key in MarkerType]: RenderOne}
