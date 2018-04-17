import {NumberSpec} from "core/vectorization"
import {LineMixinVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Arrayable} from "core/types"
import {IBBox} from "core/util/bbox"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend} from "./utils"

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
    const bd = (u*Math.pow((1 - t), 2)) + (2*v*(1 - t)*t) + (w*Math.pow(t, 2))
    return [Math.min(u, w, bd), Math.max(u, w, bd)]
  }
}

export interface QuadraticData extends GlyphData {
  _x0: Arrayable<number>
  _y0: Arrayable<number>
  _x1: Arrayable<number>
  _y1: Arrayable<number>
  _cx: Arrayable<number>
  _cy: Arrayable<number>

  sx0: Arrayable<number>
  sy0: Arrayable<number>
  sx1: Arrayable<number>
  sy1: Arrayable<number>
  scx: Arrayable<number>
  scy: Arrayable<number>
}

export interface QuadraticView extends QuadraticData {}

export class QuadraticView extends GlyphView {
  model: Quadratic
  visuals: Quadratic.Visuals

  protected _index_data(): SpatialIndex {
    const points = []

    for (let i = 0, end = this._x0.length; i < end; i++) {
      if (isNaN(this._x0[i] + this._x1[i] + this._y0[i] + this._y1[i] + this._cx[i] + this._cy[i]))
        continue

      const [x0, x1] = _qbb(this._x0[i], this._cx[i], this._x1[i])
      const [y0, y1] = _qbb(this._y0[i], this._cy[i], this._y1[i])

      points.push({minX: x0, minY: y0, maxX: x1, maxY: y1, i})
    }

    return new SpatialIndex(points)
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

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_line_legend(this.visuals, ctx, bbox, index)
  }

  scenterx(): number {
    throw new Error("not implemented")
  }

  scentery(): number {
    throw new Error("not implemented")
  }
}

export namespace Quadratic {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends Glyph.Attrs, Mixins {
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec
    cx: NumberSpec
    cy: NumberSpec
  }

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {
    line: Line
  }
}

export interface Quadratic extends Quadratic.Attrs {}

export class Quadratic extends Glyph {

  properties: Quadratic.Props

  constructor(attrs?: Partial<Quadratic.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Quadratic'
    this.prototype.default_view = QuadraticView

    this.coords([['x0', 'y0'], ['x1', 'y1'], ['cx', 'cy']])
    this.mixins(['line'])
  }
}
Quadratic.initClass()
