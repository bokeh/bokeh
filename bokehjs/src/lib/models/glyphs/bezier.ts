import {LineVector} from "core/property_mixins"
import {Line} from "core/visuals"
import {Rect, NumberArray} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_legend} from "./utils"
import {inplace} from "core/util/projections"
import * as p from "core/properties"

// algorithm adapted from http://stackoverflow.com/a/14429749/3406693
function _cbb(x0: number, y0: number,
              x1: number, y1: number,
              x2: number, y2: number,
              x3: number, y3: number): [number, number, number, number] {
  const tvalues: number[] = []
  const bounds: [number[], number[]] = [[], []]

  for (let i = 0; i <= 2; i++) {
    let a, b, c
    if (i === 0) {
      b = ((6 * x0) - (12 * x1)) + (6 * x2)
      a = (((-3 * x0) + (9 * x1)) - (9 * x2)) + (3 * x3)
      c = (3 * x1) - (3 * x0)
    } else {
      b = ((6 * y0) - (12 * y1)) + (6 * y2)
      a = (((-3 * y0) + (9 * y1)) - (9 * y2)) + (3 * y3)
      c = (3 * y1) - (3 * y0)
    }

    if (Math.abs(a) < 1e-12) { // Numerical robustness
      if (Math.abs(b) < 1e-12) // Numerical robustness
        continue
      const t = -c / b
      if (0 < t && t < 1)
        tvalues.push(t)
      continue
    }

    const b2ac = (b * b) - (4 * c * a)
    const sqrtb2ac = Math.sqrt(b2ac)

    if (b2ac < 0)
      continue

    const t1 = (-b + sqrtb2ac) / (2 * a)
    if (0 < t1 && t1 < 1)
      tvalues.push(t1)

    const t2 = (-b - sqrtb2ac) / (2 * a)
    if (0 < t2 && t2 < 1)
      tvalues.push(t2)
  }

  let j = tvalues.length
  const jlen = j
  while (j--) {
    const t = tvalues[j]
    const mt = 1 - t
    const x = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3)
    bounds[0][j] = x
    const y = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3)
    bounds[1][j] = y
  }

  bounds[0][jlen] = x0
  bounds[1][jlen] = y0
  bounds[0][jlen + 1] = x3
  bounds[1][jlen + 1] = y3

  return [
    Math.min(...bounds[0]),
    Math.max(...bounds[1]),
    Math.max(...bounds[0]),
    Math.min(...bounds[1]),
  ]
}

export interface BezierData extends GlyphData {
  _x0: NumberArray
  _y0: NumberArray
  _x1: NumberArray
  _y1: NumberArray
  _cx0: NumberArray
  _cy0: NumberArray
  _cx1: NumberArray
  _cy1: NumberArray

  sx0: NumberArray
  sy0: NumberArray
  sx1: NumberArray
  sy1: NumberArray
  scx0: NumberArray
  scy0: NumberArray
  scx1: NumberArray
  scy1: NumberArray
}

export interface BezierView extends BezierData {}

export class BezierView extends GlyphView {
  model: Bezier
  visuals: Bezier.Visuals

  protected _project_data(): void {
    inplace.project_xy(this._x0, this._y0)
    inplace.project_xy(this._x1, this._y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      if (isNaN(this._x0[i] + this._x1[i] + this._y0[i] + this._y1[i] + this._cx0[i] + this._cy0[i] + this._cx1[i] + this._cy1[i]))
        index.add_empty()
      else {
        const [x0, y0, x1, y1] = _cbb(
          this._x0[i],  this._y0[i],  this._x1[i],  this._y1[i],
          this._cx0[i], this._cy0[i], this._cx1[i], this._cy1[i],
        )
        index.add(x0, y0, x1, y1)
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1}: BezierData): void {
    if (this.visuals.line.doit) {
      for (const i of indices) {
        if (isNaN(sx0[i] + sy0[i] + sx1[i] + sy1[i] + scx0[i] + scy0[i] + scx1[i] + scy1[i]))
          continue

        ctx.beginPath()
        ctx.moveTo(sx0[i], sy0[i])
        ctx.bezierCurveTo(scx0[i], scy0[i], scx1[i], scy1[i], sx1[i], sy1[i])

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

export namespace Bezier {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    y0: p.CoordinateSpec
    x1: p.CoordinateSpec
    y1: p.CoordinateSpec
    cx0: p.CoordinateSpec
    cy0: p.CoordinateSpec
    cx1: p.CoordinateSpec
    cy1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: Line}
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Glyph {
  properties: Bezier.Props
  __view_type__: BezierView

  constructor(attrs?: Partial<Bezier.Attrs>) {
    super(attrs)
  }

  static init_Bezier(): void {
    this.prototype.default_view = BezierView

    this.define<Bezier.Props>({
      x0:  [ p.XCoordinateSpec, {field: "x0"}  ],
      y0:  [ p.YCoordinateSpec, {field: "y0"}  ],
      x1:  [ p.XCoordinateSpec, {field: "x1"}  ],
      y1:  [ p.YCoordinateSpec, {field: "y1"}  ],
      cx0: [ p.XCoordinateSpec, {field: "cx0"} ],
      cy0: [ p.YCoordinateSpec, {field: "cy0"} ],
      cx1: [ p.XCoordinateSpec, {field: "cx1"} ],
      cy1: [ p.YCoordinateSpec, {field: "cy1"} ],
    })
    this.mixins<Bezier.Mixins>(LineVector)
  }
}
