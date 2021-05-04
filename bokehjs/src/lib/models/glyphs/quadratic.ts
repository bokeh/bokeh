import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, FloatArray, ScreenArray} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {inplace} from "core/util/projections"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import * as p from "core/properties"

// Formula from: http://pomax.nihongoresources.com/pages/bezier/
//
// if segment is quadratic bezier do:
//   for both directions do:
//     if control between start and end, compute linear bounding box
//     otherwise, compute
//       bound = u(1-t)^2 + 2v(1-t)t + wt^2
//         (with t = ((u-v) / (u-2v+w)), with {u = start, v = control, w = end})
//       if control precedes start, min = bound, otherwise max = bound

function _qbb(u: number, v: number, w: number): [number, number] {
  if (v == (u + w)/2)
    return [u, w]
  else {
    const t = (u - v) / ((u - (2*v)) + w)
    const bd = (u*(1 - t)**2) + (2*v*(1 - t)*t) + (w*t**2)
    return [Math.min(u, w, bd), Math.max(u, w, bd)]
  }
}

export type QuadraticData = GlyphData & p.UniformsOf<Quadratic.Mixins> & {
  _x0: FloatArray
  _y0: FloatArray
  _x1: FloatArray
  _y1: FloatArray
  _cx: FloatArray
  _cy: FloatArray

  sx0: ScreenArray
  sy0: ScreenArray
  sx1: ScreenArray
  sy1: ScreenArray
  scx: ScreenArray
  scy: ScreenArray
}

export interface QuadraticView extends QuadraticData {}

export class QuadraticView extends GlyphView {
  override model: Quadratic
  override visuals: Quadratic.Visuals

  protected override _project_data(): void {
    inplace.project_xy(this._x0, this._y0)
    inplace.project_xy(this._x1, this._y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {_x0, _x1, _y0, _y1, _cx, _cy, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = _x0[i]
      const x1_i = _x1[i]
      const y0_i = _y0[i]
      const y1_i = _y1[i]
      const cx_i = _cx[i]
      const cy_i = _cy[i]

      if (!isFinite(x0_i + x1_i + y0_i + y1_i + cx_i + cy_i))
        index.add_empty()
      else {
        const [x0, x1] = _qbb(x0_i, cx_i, x1_i)
        const [y0, y1] = _qbb(y0_i, cy_i, y1_i)

        index.add_rect(x0, y0, x1, y1)
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: QuadraticData): void {
    if (this.visuals.line.doit) {
      const {sx0, sy0, sx1, sy1, scx, scy} = data ?? this

      for (const i of indices) {
        const sx0_i = sx0[i]
        const sy0_i = sy0[i]
        const sx1_i = sx1[i]
        const sy1_i = sy1[i]
        const scx_i = scx[i]
        const scy_i = scy[i]

        if (!isFinite(sx0_i + sy0_i + sx1_i + sy1_i + scx_i + scy_i))
          continue

        ctx.beginPath()
        ctx.moveTo(sx0_i, sy0_i)
        ctx.quadraticCurveTo(scx_i, scy_i, sx1_i, sy1_i)

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(): [number, number] {
    throw new Error(`${this}.scenterxy() is not implemented`)
  }
}

export namespace Quadratic {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    y0: p.CoordinateSpec
    x1: p.CoordinateSpec
    y1: p.CoordinateSpec
    cx: p.CoordinateSpec
    cy: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}
}

export interface Quadratic extends Quadratic.Attrs {}

export class Quadratic extends Glyph {
  override properties: Quadratic.Props
  override __view_type__: QuadraticView

  constructor(attrs?: Partial<Quadratic.Attrs>) {
    super(attrs)
  }

  static init_Quadratic(): void {
    this.prototype.default_view = QuadraticView

    this.define<Quadratic.Props>(({}) => ({
      x0: [ p.XCoordinateSpec, {field: "x0"} ],
      y0: [ p.YCoordinateSpec, {field: "y0"} ],
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
      cx: [ p.XCoordinateSpec, {field: "cx"} ],
      cy: [ p.YCoordinateSpec, {field: "cy"} ],
    }))
    this.mixins<Quadratic.Mixins>(LineVector)
  }
}
