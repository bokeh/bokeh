import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {generic_area_legend} from "./utils"
import {PointGeometry} from "core/geometry"
import {LineVector, FillVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {Rect, NumberArray} from "core/types"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {angle_between} from "core/util/math"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export interface WedgeData extends XYGlyphData {
  _radius: NumberArray
  _start_angle: NumberArray
  _end_angle: NumberArray

  sradius: NumberArray

  max_radius: number
}

export interface WedgeView extends WedgeData {}

export class WedgeView extends XYGlyphView {
  model: Wedge
  visuals: Wedge.Visuals

  protected _map_data(): void {
    if (this.model.properties.radius.units == "data")
      this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius)
    else
      this.sradius = this._radius
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sradius, _start_angle, _end_angle}: WedgeData): void {
    const direction = this.model.properties.direction.value()

    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sradius[i] + _start_angle[i] + _end_angle[i]))
        continue

      ctx.beginPath()
      ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction)
      ctx.lineTo(sx[i], sy[i])
      ctx.closePath()

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

    const direction = this.model.properties.direction.value()
    const indices: number[] = []

    for (const i of candidates) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(sy-this.sy[i], sx-this.sx[i])
      if (angle_between(-angle, -this._start_angle[i], -this._end_angle[i], direction)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }

  scenterxy(i: number): [number, number] {
    const r = this.sradius[i] / 2
    const a = (this._start_angle[i] + this._end_angle[i]) / 2
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

  export type Mixins = LineVector & FillVector

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill}
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

    this.mixins<Wedge.Mixins>([LineVector, FillVector])
    this.define<Wedge.Props>({
      direction:    [ p.Direction,   'anticlock' ],
      radius:       [ p.DistanceSpec             ],
      start_angle:  [ p.AngleSpec                ],
      end_angle:    [ p.AngleSpec                ],
    })
  }
}
