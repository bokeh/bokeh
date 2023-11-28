import type {XYGlyphData} from "./xy_glyph"
import {XYGlyph, XYGlyphView} from "./xy_glyph"
import type {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type {Rect, Indices} from "core/types"
import {to_screen} from "core/types"
import type {Arrayable} from "core/types"
import {RadiusDimension} from "core/enums"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import type {SpatialIndex} from "core/util/spatial"
import {elementwise} from "core/util/array"
import {minmax2} from "core/util/arrayable"
import type {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import type {Range1d} from "../ranges/range1d"
import type {CircleGL} from "./webgl/circle"

export type CircleData = XYGlyphData & p.UniformsOf<Circle.Mixins> & {
  readonly angle: p.Uniform<number>
  readonly radius: p.Uniform<number>
  readonly max_radius: number
  sradius: Arrayable<number>
}

export interface CircleView extends CircleData {}

export class CircleView extends XYGlyphView {
  declare model: Circle
  declare visuals: Circle.Visuals

  /** @internal */
  declare glglyph?: CircleGL

  override async load_glglyph() {
    const {CircleGL} = await import("./webgl/circle")
    return CircleGL
  }

  protected override _index_data(index: SpatialIndex): void {
    const {_x, _y, radius, data_size} = this
    for (let i = 0; i < data_size; i++) {
      const x = _x[i]
      const y = _y[i]
      const r = radius.get(i)
      index.add_rect(x - r, y - r, x + r, y + r)
    }
  }

  protected override _map_data(): void {
    this.sradius = (() => {
      if (this.model.properties.radius.units == "data") {
        const sradius_x = () => this.sdist(this.renderer.xscale, this._x, this.radius)
        const sradius_y = () => this.sdist(this.renderer.yscale, this._y, this.radius)

        switch (this.model.radius_dimension) {
          case "x":   return sradius_x()
          case "y":   return sradius_y()
          case "max": return elementwise(sradius_x(), sradius_y(), Math.max)
          case "min": return elementwise(sradius_x(), sradius_y(), Math.min)
        }
      } else {
        return to_screen(this.radius)
      }
    })()
  }

  protected override _mask_data(): Indices {
    const {frame} = this.renderer.plot_view

    const shr = frame.x_target
    const svr = frame.y_target

    let hr: Range1d
    let vr: Range1d
    if (this.model.properties.radius.units == "data") {
      hr = shr.map((x) => this.renderer.xscale.invert(x)).widen(this.max_radius)
      vr = svr.map((y) => this.renderer.yscale.invert(y)).widen(this.max_radius)
    } else {
      hr = shr.widen(this.max_radius).map((x) => this.renderer.xscale.invert(x))
      vr = svr.widen(this.max_radius).map((y) => this.renderer.yscale.invert(y))
    }

    return this.index.indices({
      x0: hr.start, x1: hr.end,
      y0: vr.start, y1: vr.end,
    })
  }

  protected _render(ctx: Context2d, indices: number[], data?: CircleData): void {
    const {sx, sy, sradius} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sradius_i = sradius[i]

      if (!isFinite(sx_i + sy_i + sradius_i))
        continue

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
        const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
        const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
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

  // circle does not inherit from marker (since it also accepts radius) so we
  // must supply a draw_legend for it  here
  override draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
    // using objects like this seems a little wonky, since the keys are coerced to
    // stings, but it works
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const sradius: number[] = new Array(len)
    sradius[index] = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.2

    this._render(ctx, [index], {sx, sy, sradius} as any) // XXX
  }
}

export namespace Circle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    radius: p.DistanceSpec
    radius_dimension: p.Property<RadiusDimension>
    hit_dilation: p.Property<number>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Circle extends Circle.Attrs {}

export class Circle extends XYGlyph {
  declare properties: Circle.Props
  declare __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([LineVector, FillVector, HatchVector])

    this.define<Circle.Props>(({Number}) => ({
      radius:           [ p.DistanceSpec, {field: "radius"} ],
      radius_dimension: [ RadiusDimension, "x" ],
      hit_dilation:     [ Number, 1.0 ],
    }))
  }
}
