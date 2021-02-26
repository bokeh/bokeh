import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_area_vector_legend} from "./utils"
import {PointGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import {Rect, ScreenArray, to_screen} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {angle_between} from "core/util/math"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export type WedgeData = XYGlyphData & p.UniformsOf<Wedge.Mixins> & {
  readonly radius: p.Uniform<number>
  sradius: ScreenArray
  readonly max_radius: number

  readonly start_angle: p.Uniform<number>
  readonly end_angle: p.Uniform<number>
}

export interface WedgeView extends WedgeData {}

export class WedgeView extends XYGlyphView {
  model: Wedge
  visuals: Wedge.Visuals

  protected _map_data(): void {
    if (this.model.properties.radius.units == "data")
      this.sradius = this.sdist(this.renderer.xscale, this._x, this.radius)
    else
      this.sradius = to_screen(this.radius)
  }

  protected _render(ctx: Context2d, indices: number[], data?: WedgeData): void {
    const {sx, sy, sradius, start_angle, end_angle} = data ?? this
    const anticlock = this.model.direction == "anticlock"

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sradius_i = sradius[i]
      const start_angle_i = start_angle.get(i)
      const end_angle_i = end_angle.get(i)

      if (isNaN(sx_i + sy_i + sradius_i + start_angle_i + end_angle_i))
        continue

      ctx.beginPath()
      ctx.arc(sx_i, sy_i, sradius_i, start_angle_i, end_angle_i, anticlock)
      ctx.lineTo(sx_i, sy_i)
      ctx.closePath()

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.fill()
      }

      if (this.visuals.hatch.doit) {
        this.visuals.hatch.set_vectorize(ctx, i)
        ctx.fill()
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    let dist, sx0, sx1, sy0, sy1, x0, x1, y0, y1
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    // check diameter first
    const max_diameter = 2 * this.max_radius
    if (this.model.properties.radius.units === "data") {
      x0 = x - max_diameter
      x1 = x + max_diameter

      y0 = y - max_diameter
      y1 = y + max_diameter
    } else {
      sx0 = sx - max_diameter
      sx1 = sx + max_diameter
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      sy0 = sy - max_diameter
      sy1 = sy + max_diameter
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const candidates: number[] = []

    for (const i of this.index.indices({x0, x1, y0, y1})) {
      const r2 = this.sradius[i]**2
      ;[sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
      ;[sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
      dist = (sx0-sx1)**2 + (sy0-sy1)**2
      if (dist <= r2) {
        candidates.push(i)
      }
    }

    const anticlock = this.model.direction == "anticlock"
    const indices: number[] = []

    for (const i of candidates) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(sy - this.sy[i], sx - this.sx[i])
      if (angle_between(-angle, -this.start_angle.get(i), -this.end_angle.get(i), anticlock)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(i: number): [number, number] {
    const r = this.sradius[i] / 2
    const a = (this.start_angle.get(i) + this.end_angle.get(i)) / 2
    const scx = this.sx[i] + r*Math.cos(a)
    const scy = this.sy[i] + r*Math.sin(a)
    return [scx, scy]
  }
}

export namespace Wedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    direction: p.Property<Direction>
    radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Wedge extends Wedge.Attrs {}

export class Wedge extends XYGlyph {
  properties: Wedge.Props
  __view_type__: WedgeView

  constructor(attrs?: Partial<Wedge.Attrs>) {
    super(attrs)
  }

  static init_Wedge(): void {
    this.prototype.default_view = WedgeView

    this.mixins<Wedge.Mixins>([LineVector, FillVector, HatchVector])
    this.define<Wedge.Props>(({}) => ({
      direction:    [ Direction, "anticlock" ],
      radius:       [ p.DistanceSpec, {field: "radius"} ],
      start_angle:  [ p.AngleSpec, {field: "start_angle"} ],
      end_angle:    [ p.AngleSpec, {field: "end_angle"} ],
    }))
  }
}
