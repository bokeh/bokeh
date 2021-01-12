import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_area_vector_legend} from "./utils"
import {PointGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Rect, FloatArray, ScreenArray, to_screen} from "core/types"
import * as visuals from "core/visuals"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {angle_between} from "core/util/math"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export type AnnularWedgeData = XYGlyphData & p.UniformsOf<AnnularWedge.Mixins> & {
  _inner_radius: FloatArray
  _outer_radius: FloatArray

  _start_angle: ScreenArray
  _end_angle: ScreenArray
  _angle: ScreenArray

  sinner_radius: ScreenArray
  souter_radius: ScreenArray

  max_inner_radius: number
  max_outer_radius: number
}

export interface AnnularWedgeView extends AnnularWedgeData {}

export class AnnularWedgeView extends XYGlyphView {
  model: AnnularWedge
  visuals: AnnularWedge.Visuals

  protected _map_data(): void {
    if (this.model.properties.inner_radius.units == "data")
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this._inner_radius)
    else
      this.sinner_radius = to_screen(this._inner_radius)

    if (this.model.properties.outer_radius.units == "data")
      this.souter_radius = this.sdist(this.renderer.xscale, this._x, this._outer_radius)
    else
      this.souter_radius = to_screen(this._outer_radius)

    this._angle = new ScreenArray(this._start_angle.length)

    for (let i = 0, end = this._start_angle.length; i < end; i++) {
      this._angle[i] = this._end_angle[i] - this._start_angle[i]
    }
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sx, sy, _start_angle, _angle, sinner_radius, souter_radius}: AnnularWedgeData): void {
    const anticlock = this.model.direction == "anticlock"

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sinner_radius_i = sinner_radius[i]
      const souter_radius_i = souter_radius[i]
      const start_angle_i = _start_angle[i]
      const angle_i = _angle[i]

      if (isNaN(sx_i + sy_i + sinner_radius_i + souter_radius_i + start_angle_i + angle_i))
        continue

      ctx.translate(sx_i, sy_i)
      ctx.rotate(start_angle_i)

      ctx.beginPath()
      ctx.moveTo(souter_radius_i, 0)
      ctx.arc(0, 0, souter_radius_i, 0, angle_i, anticlock)
      ctx.rotate(angle_i)
      ctx.lineTo(sinner_radius_i, 0)
      ctx.arc(0, 0, sinner_radius_i, 0, -angle_i, !anticlock)
      ctx.closePath()

      ctx.rotate(-angle_i - start_angle_i)
      ctx.translate(-sx_i, -sy_i)

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
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    // check radius first
    let x0: number, y0: number
    let x1: number, y1: number
    if (this.model.properties.outer_radius.units == "data") {
      x0 = x - this.max_outer_radius
      x1 = x + this.max_outer_radius

      y0 = y - this.max_outer_radius
      y1 = y + this.max_outer_radius
    } else {
      const sx0 = sx - this.max_outer_radius
      const sx1 = sx + this.max_outer_radius
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      const sy0 = sy - this.max_outer_radius
      const sy1 = sy + this.max_outer_radius
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const candidates: number[] = []

    for (const i of this.index.indices({x0, x1, y0, y1})) {
      const or2 = this.souter_radius[i]**2
      const ir2 = this.sinner_radius[i]**2
      const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
      const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
      const dist = (sx0-sx1)**2 + (sy0-sy1)**2
      if (dist <= or2 && dist >= ir2)
        candidates.push(i)
    }

    const anticlock = this.model.direction == "anticlock"
    const indices: number[] = []
    for (const i of candidates) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(sy - this.sy[i], sx - this.sx[i])
      if (angle_between(-angle, -this._start_angle[i], -this._end_angle[i], anticlock)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(i: number): [number, number] {
    const r = (this.sinner_radius[i] + this.souter_radius[i])/2
    const a = (this._start_angle[i]  + this._end_angle[i])   /2
    const scx = this.sx[i] + r*Math.cos(a)
    const scy = this.sy[i] + r*Math.sin(a)
    return [scx, scy]
  }
}

export namespace AnnularWedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    direction: p.Property<Direction>
    inner_radius: p.DistanceSpec
    outer_radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface AnnularWedge extends AnnularWedge.Attrs {}

export class AnnularWedge extends XYGlyph {
  properties: AnnularWedge.Props
  __view_type__: AnnularWedgeView

  constructor(attrs?: Partial<AnnularWedge.Attrs>) {
    super(attrs)
  }

  static init_AnnularWedge(): void {
    this.prototype.default_view = AnnularWedgeView

    this.mixins<AnnularWedge.Mixins>([LineVector, FillVector, HatchVector])

    this.define<AnnularWedge.Props>(({}) => ({
      direction:    [ Direction, "anticlock" ],
      inner_radius: [ p.DistanceSpec ],
      outer_radius: [ p.DistanceSpec ],
      start_angle:  [ p.AngleSpec ],
      end_angle:    [ p.AngleSpec ],
    }))
  }
}
