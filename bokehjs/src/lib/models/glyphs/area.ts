import {Glyph, GlyphView} from "./glyph"
import {generic_area_scalar_legend} from "./utils"
import type * as visuals from "core/visuals"
import type {Arrayable, Rect} from "core/types"
import type {Context2d} from "core/util/canvas"
import type * as p from "core/properties"
import * as mixins from "core/property_mixins"
import type {StepMode} from "core/enums"
import {flip_step_mode} from "core/util/flip_step_mode"
import type {ScreenLine} from "./curve"

type Point = [number, number]

function valid_runs(...arrays: Arrayable<number>[]): [number, number][] {
  const n = Math.min(...arrays.map((array) => array.length))
  const runs: [number, number][] = []
  let start = -1
  for (let i = 0; i <= n; i++) {
    const valid = i < n && arrays.every((array) => isFinite(array[i]))
    if (valid && start < 0) {
      start = i
    } else if (!valid && start >= 0) {
      if (i - start >= 2) {
        runs.push([start, i])
      }
      start = -1
    }
  }
  return runs
}

function to_screen_line(rings: Point[][]): ScreenLine {
  const length = rings.reduce((total, ring) => total + ring.length, 0) + Math.max(0, rings.length - 1)
  const sx = new Float32Array(length)
  const sy = new Float32Array(length)
  let offset = 0
  for (let r = 0; r < rings.length; r++) {
    if (r > 0) {
      sx[offset] = NaN
      sy[offset] = NaN
      offset++
    }
    for (const point of rings[r]) {
      sx[offset] = point[0]
      sy[offset] = point[1]
      offset++
    }
  }
  return {sx, sy}
}

export function area_path(
  x0: Arrayable<number>, y0: Arrayable<number>, x1: Arrayable<number>, y1: Arrayable<number>,
): ScreenLine {
  const rings: Point[][] = []
  for (const [start, end] of valid_runs(x0, y0, x1, y1)) {
    const ring: Point[] = []
    for (let i = start; i < end; i++) {
      ring.push([x0[i], y0[i]])
    }
    for (let i = end - 1; i >= start; i--) {
      ring.push([x1[i], y1[i]])
    }
    ring.push(ring[0])
    rings.push(ring)
  }
  return to_screen_line(rings)
}

function step_points(x: number[], y: number[], mode: StepMode, axis: "x" | "y"): Point[] {
  if (x.length == 0) {
    return []
  }
  const points: Point[] = [[x[0], y[0]]]
  for (let i = 1; i < x.length; i++) {
    const prev_x = x[i - 1]
    const prev_y = y[i - 1]
    switch (mode) {
      case "before": {
        points.push(axis == "x" ? [prev_x, y[i]] : [x[i], prev_y])
        break
      }
      case "after": {
        points.push(axis == "x" ? [x[i], prev_y] : [prev_x, y[i]])
        break
      }
      case "center": {
        if (axis == "x") {
          const mid = (prev_x + x[i])/2
          points.push([mid, prev_y], [mid, y[i]])
        } else {
          const mid = (prev_y + y[i])/2
          points.push([prev_x, mid], [x[i], mid])
        }
        break
      }
    }
    points.push([x[i], y[i]])
  }
  return points
}

export function stepped_area_path(
  x0: Arrayable<number>, y0: Arrayable<number>, x1: Arrayable<number>, y1: Arrayable<number>,
  mode: StepMode, axis: "x" | "y",
): ScreenLine {
  const rings: Point[][] = []
  for (const [start, end] of valid_runs(x0, y0, x1, y1)) {
    const first_x = Array.from({length: end - start}, (_, i) => x0[start + i])
    const first_y = Array.from({length: end - start}, (_, i) => y0[start + i])
    const second_x = Array.from({length: end - start}, (_, i) => x1[end - 1 - i])
    const second_y = Array.from({length: end - start}, (_, i) => y1[end - 1 - i])
    const ring = [
      ...step_points(first_x, first_y, mode, axis),
      ...step_points(second_x, second_y, flip_step_mode(mode), axis),
    ]
    ring.push(ring[0])
    rings.push(ring)
  }
  return to_screen_line(rings)
}

export interface AreaView extends Area.Data {}

export abstract class AreaView extends GlyphView {
  declare model: Area
  declare visuals: Area.Visuals

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, _index: number): void {
    generic_area_scalar_legend(this.visuals, ctx, bbox)
  }
}

export namespace Area {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & Mixins

  export type Mixins = mixins.FillScalar & mixins.HatchScalar

  export type Visuals = Glyph.Visuals & {fill: visuals.FillScalar, hatch: visuals.HatchScalar}

  export type Data = p.GlyphDataOf<Props>
}

export interface Area extends Area.Attrs {}

export class Area extends Glyph {
  declare properties: Area.Props
  declare __view_type__: AreaView

  constructor(attrs?: Partial<Area.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<Area.Mixins>([mixins.FillScalar, mixins.HatchScalar])
  }
}
