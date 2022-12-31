import {CenterRotatable, CenterRotatableView, CenterRotatableData} from "./center_rotatable"
import {PointGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import {Rect, to_screen} from "core/types"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import * as p from "core/properties"

export type EllipseData = CenterRotatableData

export interface EllipseView extends EllipseData {}

export class EllipseView extends CenterRotatableView  {
  declare model: Ellipse
  declare visuals: Ellipse.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/ellipse").EllipseGL

  override async load_glglyph() {
    const {EllipseGL} = await import("./webgl/ellipse")
    return EllipseGL
  }

  protected override _map_data(): void {
    if (this.model.properties.width.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this.width, "center")
    else
      this.sw = to_screen(this.width)

    if (this.model.properties.height.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this.height, "center")
    else
      this.sh = to_screen(this.height)
  }

  protected _render(ctx: Context2d, indices: number[], data?: EllipseData): void {
    const {sx, sy, sw, sh, angle} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sw_i = sw[i]
      const sh_i = sh[i]
      const angle_i = angle.get(i)

      if (!isFinite(sx_i + sy_i + sw_i + sh_i + angle_i))
        continue

      ctx.beginPath()
      ctx.ellipse(sx_i, sy_i, sw_i/2, sh_i/2, angle_i, 0, 2*Math.PI)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    let x0, x1, y0, y1, cond, sx0, sx1, sy0, sy1

    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    if (this.model.properties.width.units == "data") {
      x0 = x - this.max_width
      x1 = x + this.max_width
    } else {
      sx0 = sx - this.max_width
      sx1 = sx + this.max_width
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)
    }

    if (this.model.properties.height.units == "data") {
      y0 = y - this.max_height
      y1 = y + this.max_height
    } else {
      sy0 = sy - this.max_height
      sy1 = sy + this.max_height
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const candidates = this.index.indices({x0, x1, y0, y1})
    const indices: number[] = []

    for (const i of candidates) {
      cond = hittest.point_in_ellipse(sx, sy, this.angle.get(i), this.sh[i]/2, this.sw[i]/2, this.sx[i], this.sy[i])
      if (cond) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
    const n = index + 1

    const sx: number[] = new Array(n)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(n)
    sy[index] = (y0 + y1)/2

    const scale = this.sw[index] / this.sh[index]
    const d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.8

    const sw: number[] = new Array(n)
    const sh: number[] = new Array(n)
    if (scale > 1) {
      sw[index] = d
      sh[index] = d/scale
    } else {
      sw[index] = d*scale
      sh[index] = d
    }

    const angle = new p.UniformScalar(0, n) // don't attempt to match glyph angle

    this._render(ctx, [index], {sx, sy, sw, sh, angle} as any) // XXX
  }
}

export namespace Ellipse {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CenterRotatable.Props

  export type Visuals = CenterRotatable.Visuals
}

export interface Ellipse extends Ellipse.Attrs {}

export class Ellipse extends CenterRotatable {
  declare properties: Ellipse.Props
  declare __view_type__: EllipseView

  constructor(attrs?: Partial<Ellipse.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = EllipseView
  }
}
