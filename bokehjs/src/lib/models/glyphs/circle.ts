import {RadialGlyph, RadialGlyphView} from "./radial_glyph"
import type {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import type * as p from "core/properties"
import {minmax2} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import type {CircleGL} from "./webgl/circle"

export interface CircleView extends Circle.Data {}

export class CircleView extends RadialGlyphView {
  declare model: Circle
  declare visuals: Circle.Visuals

  /** @internal */
  declare glglyph?: CircleGL

  override async load_glglyph() {
    const {CircleGL} = await import("./webgl/circle")
    return CircleGL
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Circle.Data>): void {
    const {sx, sy, sradius} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sradius_i = sradius[i]

      if (!isFinite(sx_i + sy_i + sradius_i)) {
        continue
      }

      ctx.beginPath()
      ctx.arc(sx_i, sy_i, sradius_i, 0, 2*Math.PI, false)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)
    const {hit_dilation} = this.model

    const [x0, x1, y0, y1] = (() => {
      if (this.model.properties.radius.units == "data") {
        const dr = this.max_radius*hit_dilation
        const x0 = x - dr
        const x1 = x + dr
        const y0 = y - dr
        const y1 = y + dr
        return [x0, x1, y0, y1]
      } else {
        const ds = this.max_radius*hit_dilation
        const sx0 = sx - ds
        const sx1 = sx + ds
        const sy0 = sy - ds
        const sy1 = sy + ds
        const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
        const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
        return [x0, x1, y0, y1]
      }
    })()

    const candidates = this.index.indices({x0, x1, y0, y1})

    const indices: number[] = []
    if (this.model.properties.radius.units == "data") {
      for (const i of candidates) {
        const r2 = (this.sradius[i]*hit_dilation)**2
        const [sx0, sx1] = this.renderer.xscale.r_compute(x, this.x[i])
        const [sy0, sy1] = this.renderer.yscale.r_compute(y, this.y[i])
        const dist = (sx0 - sx1)**2 + (sy0 - sy1)**2
        if (dist <= r2) {
          indices.push(i)
        }
      }
    } else {
      for (const i of candidates) {
        const r2 = (this.sradius[i]*hit_dilation)**2
        const dist = (this.sx[i] - sx)**2 + (this.sy[i] - sy)**2
        if (dist <= r2) {
          indices.push(i)
        }
      }
    }

    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const bounds = this.bounds()

    const [x0, x1, y0, y1] = (() => {
      const dr = this.max_radius

      if (geometry.direction == "h") {
        // use circle bounds instead of current pointer y coordinates
        const sx0 = sx - dr
        const sx1 = sx + dr
        const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
        const {y0, y1} = bounds
        return [x0, x1, y0, y1]
      } else {
        // use circle bounds instead of current pointer x coordinates
        const sy0 = sy - dr
        const sy1 = sy + dr
        const {x0, x1} = bounds
        const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
        return [x0, x1, y0, y1]
      }
    })()

    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

    const candidates = this.index.indices({x0, x1, y0, y1})

    const indices = []
    for (const i of candidates) {
      const sx_i = this.sx[i]
      const sy_i = this.sy[i]
      if (sx0 <= sx_i && sx_i <= sx1 && sy0 <= sy_i && sy_i <= sy1) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected override _hit_poly(geometry: PolyGeometry): Selection {
    const {sx: sxs, sy: sys} = geometry

    const candidates = (() => {
      const [sx0, sx1, sy0, sy1] = minmax2(sxs, sys)

      const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
      const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

      return this.index.indices({x0, x1, y0, y1})
    })()

    const indices = []
    for (const i of candidates) {
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sxs, sys)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }
}

export namespace Circle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RadialGlyph.Props & {
    hit_dilation: p.Property<number>
  }

  export type Visuals = RadialGlyph.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface Circle extends Circle.Attrs {}

export class Circle extends RadialGlyph {
  declare properties: Circle.Props
  declare __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.define<Circle.Props>(({Float}) => ({
      hit_dilation:     [ Float, 1.0 ],
    }))
  }
}
