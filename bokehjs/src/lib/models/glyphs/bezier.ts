import {LineVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, FloatArray, ScreenArray} from "core/types"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {inplace} from "core/util/projections"
import {cbb} from "core/util/math"
import * as p from "core/properties"

export type BezierData = GlyphData & p.UniformsOf<Bezier.Mixins> & {
  _x0: FloatArray
  _y0: FloatArray
  _x1: FloatArray
  _y1: FloatArray
  _cx0: FloatArray
  _cy0: FloatArray
  _cx1: FloatArray
  _cy1: FloatArray

  sx0: ScreenArray
  sy0: ScreenArray
  sx1: ScreenArray
  sy1: ScreenArray
  scx0: ScreenArray
  scy0: ScreenArray
  scx1: ScreenArray
  scy1: ScreenArray
}

export interface BezierView extends BezierData {}

export class BezierView extends GlyphView {
  override model: Bezier
  override visuals: Bezier.Visuals

  protected override _project_data(): void {
    inplace.project_xy(this._x0, this._y0)
    inplace.project_xy(this._x1, this._y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {data_size, _x0, _y0, _x1, _y1, _cx0, _cy0, _cx1, _cy1} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = _x0[i]
      const y0_i = _y0[i]
      const x1_i = _x1[i]
      const y1_i = _y1[i]
      const cx0_i = _cx0[i]
      const cy0_i = _cy0[i]
      const cx1_i = _cx1[i]
      const cy1_i = _cy1[i]

      if (!isFinite(x0_i + x1_i + y0_i + y1_i + cx0_i + cy0_i + cx1_i + cy1_i))
        index.add_empty()
      else {
        const [x0, y0, x1, y1] = cbb(x0_i, y0_i, x1_i, y1_i, cx0_i, cy0_i, cx1_i, cy1_i)
        index.add_rect(x0, y0, x1, y1)
      }
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: BezierData): void {
    if (!this.visuals.line.doit)
      return

    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = data ?? this

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sy0_i = sy0[i]
      const sx1_i = sx1[i]
      const sy1_i = sy1[i]
      const scx0_i = scx0[i]
      const scy0_i = scy0[i]
      const scx1_i = scx1[i]
      const scy1_i = scy1[i]

      if (!isFinite(sx0_i + sy0_i + sx1_i + sy1_i + scx0_i + scy0_i + scx1_i + scy1_i))
        continue

      ctx.beginPath()
      ctx.moveTo(sx0_i, sy0_i)
      ctx.bezierCurveTo(scx0_i, scy0_i, scx1_i, scy1_i, sx1_i, sy1_i)

      this.visuals.line.apply(ctx, i)
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
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

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Glyph {
  override properties: Bezier.Props
  override __view_type__: BezierView

  constructor(attrs?: Partial<Bezier.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BezierView

    this.define<Bezier.Props>(({}) => ({
      x0:  [ p.XCoordinateSpec, {field: "x0"} ],
      y0:  [ p.YCoordinateSpec, {field: "y0"} ],
      x1:  [ p.XCoordinateSpec, {field: "x1"} ],
      y1:  [ p.YCoordinateSpec, {field: "y1"} ],
      cx0: [ p.XCoordinateSpec, {field: "cx0"} ],
      cy0: [ p.YCoordinateSpec, {field: "cy0"} ],
      cx1: [ p.XCoordinateSpec, {field: "cx1"} ],
      cy1: [ p.YCoordinateSpec, {field: "cy1"} ],
    }))
    this.mixins<Bezier.Mixins>(LineVector)
  }
}
