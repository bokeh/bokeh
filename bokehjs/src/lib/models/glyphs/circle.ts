import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, Indices, ScreenArray, to_screen} from "core/types"
import {RadiusDimension} from "core/enums"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {SpatialIndex} from "core/util/spatial"
import {map, max, minmax} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import {Range1d} from "../ranges/range1d"

export type CircleData = XYGlyphData & p.UniformsOf<Circle.Mixins> & {
  readonly angle: p.Uniform<number>

  readonly size: p.Uniform<number>
  readonly radius: p.UniformScalar<number>

  sradius: ScreenArray

  readonly max_size: number
  readonly max_radius: number
}

export interface CircleView extends CircleData {}

export class CircleView extends XYGlyphView {
  override model: Circle
  override visuals: Circle.Visuals

  /** @internal */
  override glglyph?: import("./webgl/circle").CircleGL

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null && webgl.regl_wrapper.has_webgl) {
      const {CircleGL} = await import("./webgl/circle")
      this.glglyph = new CircleGL(webgl.regl_wrapper, this)
    }
  }

  get use_radius(): boolean {
    return !(this.radius.is_Scalar() && isNaN(this.radius.value))
  }

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)

    const max_size = (() => {
      if (this.use_radius)
        return 2*this.max_radius
      else {
        const {size} = this
        return size.is_Scalar() ? size.value : max((size as p.UniformVector<number>).array)
      }
    })()

    this._configure("max_size", {value: max_size})
  }

  protected override _index_data(index: SpatialIndex): void {
    if (this.use_radius) {
      const {_x, _y, radius, data_size} = this

      for (let i = 0; i < data_size; i++) {
        const x = _x[i]
        const y = _y[i]
        const r = radius.get(i)
        index.add_rect(x - r, y - r, x + r, y + r)
      }
    } else {
      super._index_data(index)
    }
  }

  protected override _map_data(): void {
    // XXX: Order is important here: size is always present (at least
    // a default), but radius is only present if a user specifies it.
    if (this.use_radius) {
      if (this.model.properties.radius.units == "data") {
        switch (this.model.radius_dimension) {
          case "x": {
            this.sradius = this.sdist(this.renderer.xscale, this._x, this.radius)
            break
          }
          case "y": {
            this.sradius = this.sdist(this.renderer.yscale, this._y, this.radius)
            break
          }
          case "max": {
            const sradius_x = this.sdist(this.renderer.xscale, this._x, this.radius)
            const sradius_y = this.sdist(this.renderer.yscale, this._y, this.radius)
            this.sradius = map(sradius_x, (s, i) => Math.max(s, sradius_y[i]))
            break
          }
          case "min": {
            const sradius_x = this.sdist(this.renderer.xscale, this._x, this.radius)
            const sradius_y = this.sdist(this.renderer.yscale, this._y, this.radius)
            this.sradius = map(sradius_x, (s, i) => Math.min(s, sradius_y[i]))
            break
          }
        }
      } else
        this.sradius = to_screen(this.radius)
    } else {
      const ssize = ScreenArray.from(this.size)
      this.sradius = map(ssize, (s) => s/2)
    }
  }

  protected override _mask_data(): Indices {
    const {frame} = this.renderer.plot_view

    const shr = frame.x_target
    const svr = frame.y_target

    let hr: Range1d
    let vr: Range1d
    if (this.use_radius && this.model.properties.radius.units == "data") {
      hr = shr.map((x) => this.renderer.xscale.invert(x)).widen(this.max_radius)
      vr = svr.map((y) => this.renderer.yscale.invert(y)).widen(this.max_radius)
    } else {
      hr = shr.widen(this.max_size).map((x) => this.renderer.xscale.invert(x))
      vr = svr.widen(this.max_size).map((y) => this.renderer.yscale.invert(y))
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

    let x0, x1, y0, y1
    if (this.use_radius && this.model.properties.radius.units == "data") {
      x0 = x - this.max_radius*hit_dilation
      x1 = x + this.max_radius*hit_dilation

      y0 = y - this.max_radius*hit_dilation
      y1 = y + this.max_radius*hit_dilation
    } else {
      const sx0 = sx - this.max_size*hit_dilation
      const sx1 = sx + this.max_size*hit_dilation
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      const sy0 = sy - this.max_size*hit_dilation
      const sy1 = sy + this.max_size*hit_dilation
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const candidates = this.index.indices({x0, x1, y0, y1})

    const indices: number[] = []
    if (this.use_radius && this.model.properties.radius.units == "data") {
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

    let x0, x1, y0, y1
    if (geometry.direction == "h") {
      // use circle bounds instead of current pointer y coordinates
      let sx0, sx1
      y0 = bounds.y0
      y1 = bounds.y1
      if (this.use_radius && this.model.properties.radius.units == "data") {
        sx0 = sx - this.max_radius
        sx1 = sx + this.max_radius
        ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
      } else {
        const ms = this.max_size/2
        sx0 = sx - ms
        sx1 = sx + ms
        ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
      }
    } else {
      // use circle bounds instead of current pointer x coordinates
      let sy0, sy1
      x0 = bounds.x0
      x1 = bounds.x1
      if (this.use_radius && this.model.properties.radius.units == "data") {
        sy0 = sy - this.max_radius
        sy1 = sy + this.max_radius
        ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
      } else {
        const ms = this.max_size/2
        sy0 = sy - ms
        sy1 = sy + ms
        ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
      }
    }

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
    const {sx, sy} = geometry

    const [sx0, sx1] = minmax(sx)
    const [sy0, sy1] = minmax(sy)

    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)

    const candidates = this.index.indices({x0, x1, y0, y1})

    const indices = []
    for (const i of candidates) {
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sx, sy)) {
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
    angle: p.AngleSpec
    size: p.DistanceSpec
    radius: p.NullDistanceSpec
    radius_dimension: p.Property<RadiusDimension>
    hit_dilation: p.Property<number>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Circle extends Circle.Attrs {}

export class Circle extends XYGlyph {
  override properties: Circle.Props
  override __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([LineVector, FillVector, HatchVector])

    this.define<Circle.Props>(({Number}) => ({
      angle:            [ p.AngleSpec, 0 ],
      size:             [ p.ScreenSizeSpec, {value: 4} ],
      radius:           [ p.NullDistanceSpec, null ],
      radius_dimension: [ RadiusDimension, "x" ],
      hit_dilation:     [ Number, 1.0 ],
    }))
  }
}
