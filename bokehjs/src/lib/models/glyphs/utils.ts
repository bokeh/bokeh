import {Visuals, Line, Fill} from "core/visuals"
import {Context2d} from "core/util/canvas"
import {IBBox} from "core/util/bbox"
import {PointGeometry, SpanGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import {GlyphRendererView} from "../renderers/glyph_renderer"

export function generic_line_legend(visuals: Visuals & {line: Line}, ctx: Context2d, {x0, x1, y0, y1}: IBBox, index: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x0, (y0 + y1) /2)
  ctx.lineTo(x1, (y0 + y1) /2)
  if (visuals.line.doit) {
    visuals.line.set_vectorize(ctx, index)
    ctx.stroke()
  }
  ctx.restore()
}

export function generic_area_legend(visuals: {line: Line, fill: Fill}, ctx: Context2d, {x0, x1, y0, y1}: IBBox, index: number): void {
  const w = Math.abs(x1 - x0)
  const dw = w*0.1
  const h = Math.abs(y1 - y0)
  const dh = h*0.1

  const sx0 = x0 + dw
  const sx1 = x1 - dw

  const sy0 = y0 + dh
  const sy1 = y1 - dh

  if (visuals.fill.doit) {
    visuals.fill.set_vectorize(ctx, index)
    ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0)
  }

  if (visuals.line.doit) {
    ctx.beginPath()
    ctx.rect(sx0, sy0, sx1 - sx0, sy1 - sy0)
    visuals.line.set_vectorize(ctx, index)
    ctx.stroke()
  }
}

export function line_interpolation(renderer: GlyphRendererView, geometry: PointGeometry | SpanGeometry, x2: number, y2: number, x3: number, y3: number): [number, number] {
  const {sx, sy} = geometry
  let x0: number, x1: number
  let y0: number, y1: number

  if (geometry.type == 'point') {
    // The +/- adjustments here are to dilate the hit point into a virtual "segment" to use below
    ;[y0, y1] = renderer.yscale.r_invert(sy-1, sy+1)
    ;[x0, x1] = renderer.xscale.r_invert(sx-1, sx+1)
  } else {
    // The +/- adjustments here are to handle cases such as purely horizontal or vertical lines
    if (geometry.direction == 'v') {
      ;[y0, y1] = renderer.yscale.r_invert(sy, sy)
      ;[x0, x1] = [Math.min(x2-1, x3-1), Math.max(x2+1, x3+1)]
    } else {
      ;[x0, x1] = renderer.xscale.r_invert(sx, sx)
      ;[y0, y1] = [Math.min(y2-1, y3-1), Math.max(y2+1, y3+1)]
    }
  }

  const {x, y} = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3)
  return [x!, y!] // XXX: null is not handled at use sites
}
