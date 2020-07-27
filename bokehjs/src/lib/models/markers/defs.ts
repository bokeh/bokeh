import {Marker, MarkerView} from "./marker"
import {MarkerType} from "core/enums"
import {Class} from "core/class"
import {Line, Fill} from "core/visuals"
import {Context2d} from "core/util/canvas"
import * as glmarks from "../glyphs/webgl/markers"

const SQ3 = Math.sqrt(3)

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

function _one_tri(ctx: Context2d, r: number): void {
  const h = r*SQ3
  const a = h/3

  ctx.moveTo(-r, a)
  ctx.lineTo(r, a)
  ctx.lineTo(0, a-h)
  ctx.closePath()
}

function asterisk(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_cross(ctx, r)
  _one_x(ctx, r)

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function circle(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function circle_cross(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    _one_cross(ctx, r)
    ctx.stroke()
  }

}

function circle_dot(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  circle(ctx, i, r, line, fill)
  dot(ctx, i, r, line, fill)
}

function circle_y(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    _one_y(ctx, r)
    ctx.stroke()
  }

}

function circle_x(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    _one_x(ctx, r)
    ctx.stroke()
  }

}

function cross(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_cross(ctx, r)

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function diamond(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  _one_diamond(ctx, r)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function diamond_cross(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  _one_diamond(ctx, r)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.moveTo(0,  r)
    ctx.lineTo(0, -r)
    ctx.moveTo(-r/1.5,  0)
    ctx.lineTo(r/1.5,  0)
    ctx.stroke()
  }

}

function diamond_dot(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  diamond(ctx, i, r, line, fill)
  dot(ctx, i, r, line, fill)
}

function dot(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_dot(ctx, r)

  line.set_vectorize(ctx, i)
  ctx.fillStyle = ctx.strokeStyle // NOTE: dots use line color for fill to match
  ctx.fill()

}

function hex(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  _one_hex(ctx, r)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function hex_dot(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  hex(ctx, i, r, line, fill)
  dot(ctx, i, r, line, fill)
}

function inverted_triangle(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  ctx.rotate(Math.PI)
  _one_tri(ctx, r)
  ctx.rotate(-Math.PI)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function plus(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const a = 3*r/8
  const b = r
  const xs = [a, a, b,  b,  a,  a, -a, -a, -b, -b, -a, -a]
  const ys = [b, a, a, -a, -a, -b, -b, -a, -a,  a,  a,  b]

  ctx.moveTo(xs[0], ys[0])
  for (i=1; i<12; i++)
    ctx.lineTo(xs[i], ys[i])
  ctx.closePath()

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function square(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function square_pin(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const a = 3*r/8

  ctx.moveTo(-r, -r)
  /* eslint-disable space-in-parens */
  ctx.quadraticCurveTo( 0, -a,  r, -r)
  ctx.quadraticCurveTo( a,  0,  r,  r)
  ctx.quadraticCurveTo( 0,  a, -r,  r)
  ctx.quadraticCurveTo(-a,  0, -r, -r)
  /* eslint-ensable space-in-parens */

  ctx.closePath()

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function square_cross(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    _one_cross(ctx, r)
    ctx.stroke()
  }

}

function square_dot(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  square(ctx, i, r, line, fill)
  dot(ctx, i, r, line, fill)
}

function square_x(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const size = 2*r

  ctx.rect(-r, -r, size, size)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.moveTo(-r,  r)
    ctx.lineTo(r, -r)
    ctx.moveTo(-r, -r)
    ctx.lineTo(r,  r)
    ctx.stroke()
  }

}

function triangle(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  _one_tri(ctx, r)

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function triangle_dot(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  triangle(ctx, i, r, line, fill)
  dot(ctx, i, r, line, fill)
}

function triangle_pin(ctx: Context2d, i: number, r: number, line: Line, fill: Fill): void {
  const h = r*SQ3
  const a = h/3
  const b = 3*a/8

  ctx.moveTo(-r, a)
  ctx.quadraticCurveTo(0, b,  r, a)
  ctx.quadraticCurveTo(SQ3*b/2, b/2,  0, a-h)
  ctx.quadraticCurveTo(-SQ3*b/2, b/2, -r, a)
  ctx.closePath()

  if (fill.doit) {
    fill.set_vectorize(ctx, i)
    ctx.fill()
  }

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }

}

function dash(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_line(ctx, r)

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }
}

function x(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_x(ctx, r)

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }
}

function y(ctx: Context2d, i: number, r: number, line: Line, _fill: Fill): void {
  _one_y(ctx, r)

  if (line.doit) {
    line.set_vectorize(ctx, i)
    ctx.stroke()
  }
}

function _mk_model(type: string, f: RenderOne, glglyph_cls?: Class<glmarks.MarkerGL>): Class<Marker> {
  const view = class extends MarkerView {
    static initClass(): void {
      this.prototype._render_one = f
      this.prototype.glglyph_cls = glglyph_cls
    }
  }
  view.initClass()

  const model = class extends Marker {
    static __name__ = type
    static initClass(): void {
      this.prototype.default_view = view
    }
  }
  model.initClass()

  return model
}

export type RenderOne = (ctx: Context2d, i: number, r: number, line: Line, fill: Fill) => void

// markers are final, so no need to export views
export const Asterisk = _mk_model('Asterisk', asterisk, glmarks.AsteriskGL)
export const CircleCross = _mk_model('CircleCross', circle_cross, glmarks.CircleCrossGL)
export const CircleDot = _mk_model('CircleDot', circle_dot)
export const CircleY = _mk_model('CircleY', circle_y)
export const CircleX = _mk_model('CircleX', circle_x, glmarks.CircleXGL)
export const Cross = _mk_model('Cross', cross, glmarks.CrossGL)
export const Dash = _mk_model('Dash', dash)
export const Diamond = _mk_model('Diamond', diamond, glmarks.DiamondGL)
export const DiamondCross = _mk_model('DiamondCross', diamond_cross, glmarks.DiamondCrossGL)
export const DiamondDot = _mk_model('DiamondDot', diamond_dot)
export const Dot = _mk_model('Dot', dot)
export const Hex = _mk_model('Hex', hex, glmarks.HexGL)
export const HexDot = _mk_model('HexDot', hex_dot)
export const InvertedTriangle = _mk_model('InvertedTriangle', inverted_triangle, glmarks.InvertedTriangleGL)
export const Plus = _mk_model('Plus', plus)
export const Square = _mk_model('Square', square, glmarks.SquareGL)
export const SquareCross = _mk_model('SquareCross', square_cross, glmarks.SquareCrossGL)
export const SquareDot = _mk_model('SquareDot', square_dot)
export const SquarePin = _mk_model('SquarePin', square_pin)
export const SquareX = _mk_model('SquareX', square_x, glmarks.SquareXGL)
export const Triangle = _mk_model('Triangle', triangle, glmarks.TriangleGL)
export const TriangleDot = _mk_model('TriangleDot', triangle_dot)
export const TrianglePin = _mk_model('TrianglePin', triangle_pin)
export const X = _mk_model('X', x, glmarks.XGL)
export const Y = _mk_model('Y', y)

export const marker_funcs: {[key in MarkerType]: RenderOne} = {
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
  triangle,
  triangle_dot,
  triangle_pin,
  dash,
  x,
  y,
}
