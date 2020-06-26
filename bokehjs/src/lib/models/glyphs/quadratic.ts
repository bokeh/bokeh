import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Rect, NumberArray} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend} from "./utils"
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

export interface QuadraticData extends GlyphData {
  _x0: NumberArray
  _y0: NumberArray
  _x1: NumberArray
  _y1: NumberArray
  _cx: NumberArray
  _cy: NumberArray

  sx0: NumberArray
  sy0: NumberArray
  sx1: NumberArray
  sy1: NumberArray
  scx: NumberArray
  scy: NumberArray
}

export interface QuadraticView extends QuadraticData {}

export class QuadraticView extends GlyphView {
  model: Quadratic
  visuals: Quadratic.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      if (isNaN(this._x0[i] + this._x1[i] + this._y0[i] + this._y1[i] + this._cx[i] + this._cy[i]))
        index.add_empty()
      else {
        const [x0, x1] = _qbb(this._x0[i], this._cx[i], this._x1[i])
        const [y0, y1] = _qbb(this._y0[i], this._cy[i], this._y1[i])

        index.add(x0, y0, x1, y1)
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[], {sx0, sy0, sx1, sy1, scx, scy}: QuadraticData): void {
    if (this.visuals.line.doit) {
      for (const i of indices) {
        if (isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i] + scx[i] + scy[i]))
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.quadraticCurveTo(scx[i], scy[i], sx1[i], sy1[i])

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
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

  export type Visuals = Glyph.Visuals & {line: Line}
}

export interface Quadratic extends Quadratic.Attrs {}

export class Quadratic extends Glyph {
  properties: Quadratic.Props
  __view_type__: QuadraticView

  constructor(attrs?: Partial<Quadratic.Attrs>) {
    super(attrs)
  }

  static init_Quadratic(): void {
    this.prototype.default_view = QuadraticView

    this.define<Quadratic.Props>({
      x0: [ p.CoordinateSpec, {field: "x0"} ],
      y0: [ p.CoordinateSpec, {field: "y0"} ],
      x1: [ p.CoordinateSpec, {field: "x1"} ],
      y1: [ p.CoordinateSpec, {field: "y1"} ],
      cx: [ p.CoordinateSpec, {field: "cx"} ],
      cy: [ p.CoordinateSpec, {field: "cy"} ],
    })
    this.mixins<Quadratic.Mixins>(LineVector)
  }
}
