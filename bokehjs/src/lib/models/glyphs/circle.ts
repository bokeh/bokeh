import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {MarkerGL, CircleGL} from "./webgl/markers"
import {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "core/geometry"
import {LineVector, FillVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {Rect, NumberArray, Indices} from "core/types"
import {RadiusDimension} from "core/enums"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {range} from "core/util/array"
import {map} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface CircleData extends XYGlyphData {
  _angle: NumberArray
  _size: NumberArray
  _radius?: NumberArray

  sradius: NumberArray

  max_size: number
  max_radius: number
}

export interface CircleView extends CircleData {}

export class CircleView extends XYGlyphView {
  model: Circle
  visuals: Circle.Visuals

  /** @internal */
  glglyph?: MarkerGL

  initialize(): void {
    super.initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null) {
      this.glglyph = new CircleGL(webgl.gl, this)
    }
  }

  protected _map_data(): void {
    // XXX: Order is important here: size is always present (at least
    // a default), but radius is only present if a user specifies it.
    if (this._radius != null) {
      if (this.model.properties.radius.units == "data") {
        switch (this.model.radius_dimension) {
          case "x": {
            this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius)
            break
          }
          case "y": {
            this.sradius = this.sdist(this.renderer.yscale, this._y, this._radius)
            break
          }
          case "max": {
            const sradius_x = this.sdist(this.renderer.xscale, this._x, this._radius)
            const sradius_y = this.sdist(this.renderer.yscale, this._y, this._radius)
            this.sradius = map(sradius_x, (s, i) => Math.max(s, sradius_y[i]))
            break
          }
          case "min": {
            const sradius_x = this.sdist(this.renderer.xscale, this._x, this._radius)
            const sradius_y = this.sdist(this.renderer.yscale, this._y, this._radius)
            this.sradius = map(sradius_x, (s, i) => Math.min(s, sradius_y[i]))
            break
          }
        }
      } else {
        this.sradius = this._radius
        this.max_size = 2*this.max_radius
      }
    } else
      this.sradius = map(this._size, (s) => s/2)
  }

  protected _mask_data(): Indices {
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges

    let x0: number, y0: number
    let x1: number, y1: number
    if (this._radius != null && this.model.properties.radius.units == "data") {
      const sx0 = hr.start
      const sx1 = hr.end
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
      x0 -= this.max_radius
      x1 += this.max_radius

      const sy0 = vr.start
      const sy1 = vr.end
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
      y0 -= this.max_radius
      y1 += this.max_radius
    } else {
      const sx0 = hr.start - this.max_size
      const sx1 = hr.end + this.max_size
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      const sy0 = vr.start - this.max_size
      const sy1 = vr.end + this.max_size
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    return this.index.indices({x0, x1, y0, y1})
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sradius}: CircleData): void {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sradius[i]))
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sradius[i], 0, 2*Math.PI, false)

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.fill()
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    let x0, x1, y0, y1
    if (this._radius != null && this.model.properties.radius.units == "data") {
      x0 = x - this.max_radius
      x1 = x + this.max_radius

      y0 = y - this.max_radius
      y1 = y + this.max_radius
    } else {
      const sx0 = sx - this.max_size
      const sx1 = sx + this.max_size
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      const sy0 = sy - this.max_size
      const sy1 = sy + this.max_size
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const candidates = this.index.indices({x0, x1, y0, y1})

    const indices: number[] = []
    if (this._radius != null && this.model.properties.radius.units == "data") {
      for (const i of candidates) {
        const r2 = this.sradius[i]**2
        const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
        const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
        const dist = (sx0 - sx1)**2 + (sy0 - sy1)**2
        if (dist <= r2) {
          indices.push(i)
        }
      }
    } else {
      for (const i of candidates) {
        const r2 = this.sradius[i]**2
        const dist = (this.sx[i] - sx)**2 + (this.sy[i] - sy)**2
        if (dist <= r2) {
          indices.push(i)
        }
      }
    }

    return new Selection({indices})
  }

  protected _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry
    const bounds = this.bounds()

    let x0, x1, y0, y1
    if (geometry.direction == 'h') {
      // use circle bounds instead of current pointer y coordinates
      let sx0, sx1
      y0 = bounds.y0
      y1 = bounds.y1
      if (this._radius != null && this.model.properties.radius.units == "data") {
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
      if (this._radius != null && this.model.properties.radius.units == "data") {
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

  protected _hit_rect(geometry: RectGeometry): Selection {
    const {sx0, sx1, sy0, sy1} = geometry
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    const indices = [...this.index.indices({x0, x1, y0, y1})]
    return new Selection({indices})
  }

  protected _hit_poly(geometry: PolyGeometry): Selection {
    const {sx, sy} = geometry

    // TODO (bev) use spatial index to pare candidate list
    const candidates = range(0, this.sx.length)

    const indices = []
    for (let i = 0, end = candidates.length; i < end; i++) {
      const index = candidates[i]
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sx, sy)) {
        indices.push(index)
      }
    }

    return new Selection({indices})
  }

  // circle does not inherit from marker (since it also accepts radius) so we
  // must supply a draw_legend for it  here
  draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
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
    radius: p.DistanceSpec // XXX: null
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = LineVector & FillVector

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill}
}

export interface Circle extends Circle.Attrs {}

export class Circle extends XYGlyph {
  properties: Circle.Props
  __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static init_Circle(): void {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([LineVector, FillVector])

    this.define<Circle.Props>({
      angle:            [ p.AngleSpec,       0                             ],
      size:             [ p.DistanceSpec,    { units: "screen", value: 4 } ],
      radius:           [ p.DistanceSpec,    undefined, {optional: true}   ], // XXX: null
      radius_dimension: [ p.RadiusDimension, 'x'                           ],
    })
  }
}
