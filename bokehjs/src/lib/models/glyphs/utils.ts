import {Visuals, Line, Fill} from "core/visuals"
import {Context2d} from "core/util/canvas"
import {IBBox} from "core/util/bbox"

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
