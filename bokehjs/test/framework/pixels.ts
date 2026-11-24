import {expect_condition} from "./assertions"
import type {PlotView} from "@bokehjs/models/plots/plot_canvas"

export type Point = [number, number]

export function pixels(view: PlotView, [x, y]: Point): number[] {
  const {ctx, pixel_ratio} = view.canvas_view.primary
  const sx = Math.floor(view.frame.x_scale.compute(x)*pixel_ratio)
  const sy = Math.floor(view.frame.y_scale.compute(y)*pixel_ratio)
  return Array.from(ctx.getImageData(sx, sy, 1, 1).data)
}

export function expect_pixel(view: PlotView, point: Point, expected: number[]): void {
  const actual = pixels(view, point)
  expect_condition(actual.every((value, i) => Math.abs(value - expected[i]) <= 2),
    `pixel at ${point}: expected ${expected}, got ${actual}`)
}

export function region_has_ink(view: PlotView, [x0, y0]: Point, [x1, y1]: Point): boolean {
  const {ctx, pixel_ratio} = view.canvas_view.primary
  const sx0 = view.frame.x_scale.compute(x0)*pixel_ratio
  const sy0 = view.frame.y_scale.compute(y0)*pixel_ratio
  const sx1 = view.frame.x_scale.compute(x1)*pixel_ratio
  const sy1 = view.frame.y_scale.compute(y1)*pixel_ratio
  const {data} = ctx.getImageData(
    Math.ceil(Math.min(sx0, sx1)), Math.ceil(Math.min(sy0, sy1)),
    Math.floor(Math.abs(sx1 - sx0)), Math.floor(Math.abs(sy1 - sy0)),
  )
  return data.some((value, i) => i % 4 != 3 && value < 240)
}
