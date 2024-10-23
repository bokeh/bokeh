import {LineVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect} from "core/types"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import * as p from "core/properties"
import {PI} from "core/util/math"
import {QuadraticBezier} from "core/util/curves"

export interface QuadraticView extends Quadratic.Data {}

export class QuadraticView extends GlyphView {
  declare model: Quadratic
  declare visuals: Quadratic.Visuals

  protected override _project_data(): void {
    this._project_xy<Quadratic.Data>("x0", this.x0, "y0", this.y0)
    this._project_xy<Quadratic.Data>("x1", this.x1, "y1", this.y1)
  }

  protected _index_data(index: SpatialIndex): void {
    const {x0, x1, y0, y1, cx, cy, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = x0[i]
      const x1_i = x1[i]
      const y0_i = y0[i]
      const y1_i = y1[i]
      const cx_i = cx[i]
      const cy_i = cy[i]

      if (!isFinite(x0_i + x1_i + y0_i + y1_i + cx_i + cy_i)) {
        index.add_empty()
      } else {
        const curve = new QuadraticBezier(x0_i, y0_i, x1_i, y1_i, cx_i, cy_i)
        const {x0, y0, x1, y1} = curve.bounding_box()
        index.add_rect(x0, y0, x1, y1)
      }
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Quadratic.Data>): void {
    const {sx0, sy0, sx1, sy1, scx, scy} = {...this, ...data}

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sy0_i = sy0[i]
      const sx1_i = sx1[i]
      const sy1_i = sy1[i]
      const scx_i = scx[i]
      const scy_i = scy[i]

      if (!isFinite(sx0_i + sy0_i + sx1_i + sy1_i + scx_i + scy_i)) {
        continue
      }

      if (this.visuals.line.doit) {
        ctx.beginPath()
        ctx.moveTo(sx0_i, sy0_i)
        ctx.quadraticCurveTo(scx_i, scy_i, sx1_i, sy1_i)
        this.visuals.line.apply(ctx, i)
      }

      if (this.has_decorations) {
        const curve = new QuadraticBezier(sx0_i, sy0_i, sx1_i, sy1_i, scx_i, scy_i)
        this._render_decorations(ctx, i, curve)
      }
    }
  }

  protected _render_decorations(ctx: Context2d, i: number, curve: QuadraticBezier): void {
    for (const decoration of this.decorations.values()) {
      const {sx, sy, angle} = (() => {
        switch (decoration.model.node) {
          case "start": {
            const {x0: sx, y0: sy} = curve
            const angle = curve.tangent(0.0) + PI/2 + PI
            return {sx, sy, angle}
          }
          case "middle": {
            const [sx, sy] = curve.evaluate(0.5)
            const angle = curve.tangent(0.5) + PI/2
            return {sx, sy, angle}
          }
          case "end": {
            const {x1: sx, y1: sy} = curve
            const angle = curve.tangent(1.0) + PI/2
            return {sx, sy, angle}
          }
        }
      })()

      ctx.translate(sx, sy)
      ctx.rotate(angle)
      decoration.marking.paint(ctx, i)
      ctx.rotate(-angle)
      ctx.translate(-sx, -sy)
    }
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(i: number): [number, number] {
    const sx0_i = this.sx0[i]
    const sy0_i = this.sy0[i]
    const sx1_i = this.sx1[i]
    const sy1_i = this.sy1[i]
    const scx_i = this.scx[i]
    const scy_i = this.scy[i]
    const curve = new QuadraticBezier(sx0_i, sy0_i, sx1_i, sy1_i, scx_i, scy_i)
    return curve.evaluate(0.5)
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

  export type Data = p.GlyphDataOf<Props>
}

export interface Quadratic extends Quadratic.Attrs {}

export class Quadratic extends Glyph {
  declare properties: Quadratic.Props
  declare __view_type__: QuadraticView

  constructor(attrs?: Partial<Quadratic.Attrs>) {
    super(attrs)
  }

  static {
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
