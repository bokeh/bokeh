import * as M from "./marker"

SQ3 = Math.sqrt(3)

generate_marker = (type, f) ->
  class View extends M.View
    _render_one: f

  class Model extends M.Model
    default_view: View
    type: type

  return {
    Model: Model
    View: View
  }

_one_x =  (ctx, r) ->
  ctx.moveTo(-r,  r)
  ctx.lineTo( r, -r)
  ctx.moveTo(-r, -r)
  ctx.lineTo( r,  r)

_one_cross = (ctx, r) ->
  ctx.moveTo( 0,  r)
  ctx.lineTo( 0, -r)
  ctx.moveTo(-r,  0)
  ctx.lineTo( r,  0)

_one_diamond = (ctx, r) ->
  ctx.moveTo(0, r)
  ctx.lineTo(r/1.5, 0)
  ctx.lineTo(0, -r)
  ctx.lineTo(-r/1.5, 0)
  ctx.closePath()

_one_tri = (ctx, r) ->
  h = r * SQ3
  a = h/3

  # TODO (bev) use viewstate to take y-axis inversion into account
  ctx.moveTo(-r, a)
  ctx.lineTo(r, a)
  ctx.lineTo(0, a-h)
  ctx.closePath()

asterisk = (ctx, i, sx, sy, r, line, fill) ->
  r2 = r*0.65

  _one_cross(ctx, r)
  _one_x(ctx, r2)

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

circle_cross = (ctx, i, sx, sy, r, line, fill)  ->
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    _one_cross(ctx, r)
    ctx.stroke()

  return

circle_x = (ctx, i, sx, sy, r, line, fill) ->
  ctx.arc(0, 0, r, 0, 2*Math.PI, false)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    _one_x(ctx, r)
    ctx.stroke()

  return

cross = (ctx, i, sx, sy, r, line, fill) ->
  _one_cross(ctx, r)

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

diamond = (ctx, i, sx, sy, r, line, fill) ->
  _one_diamond(ctx, r)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

diamond_cross = (ctx, i, sx, sy, r, line, fill) ->
  _one_diamond(ctx, r)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    _one_cross(ctx, r)
    ctx.stroke()

  return

inverted_triangle = (ctx, i, sx, sy, r, line, fill) ->
  ctx.rotate(Math.PI)
  _one_tri(ctx, r)
  ctx.rotate(-Math.PI)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

square = (ctx, i, sx, sy, r, line, fill) ->
  size = 2*r
  ctx.rect(-r, -r, size, size)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

square_cross = (ctx, i, sx, sy, r, line, fill) ->
  size = 2*r
  ctx.rect(-r, -r, size, size)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    _one_cross(ctx, r)
    ctx.stroke()

  return

square_x = (ctx, i, sx, sy, r, line, fill) ->
  size = 2*r
  ctx.rect(-r, -r, size, size)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    _one_x(ctx, r)
    ctx.stroke()

  return

triangle = (ctx, i, sx, sy, r, line, fill) ->
  _one_tri(ctx, r)

  if fill.doit
    fill.set_vectorize(ctx, i)
    ctx.fill()

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

x = (ctx, i, sx, sy, r, line, fill) ->
  _one_x(ctx, r)

  if line.doit
    line.set_vectorize(ctx, i)
    ctx.stroke()

  return

module.exports =
  Asterisk:         generate_marker('Asterisk', asterisk)
  CircleCross:      generate_marker('CircleCross', circle_cross)
  CircleX:          generate_marker('CircleX', circle_x)
  Cross:            generate_marker('Cross', cross)
  Diamond:          generate_marker('Diamond', diamond)
  DiamondCross:     generate_marker('DiamondCross', diamond_cross)
  InvertedTriangle: generate_marker('InvertedTriangle', inverted_triangle)
  Square:           generate_marker('Square', square)
  SquareCross:      generate_marker('SquareCross', square_cross)
  SquareX:          generate_marker('SquareX', square_x)
  Triangle:         generate_marker('Triangle', triangle)
  X:                generate_marker('X', x)
