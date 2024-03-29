import {CenterRotatable, CenterRotatableView} from "./center_rotatable"
import {inherit} from "./glyph"
import type {PointGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import type {Rect} from "core/types"
import {to_screen} from "core/types"
import type {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import * as p from "core/properties"

export interface EllipseView extends Ellipse.Data {}

export class EllipseView extends CenterRotatableView  {
  declare model: Ellipse
  declare visuals: Ellipse.Visuals

  protected override _map_data(): void {
    this._define_or_inherit_attr<Ellipse.Data>("swidth", () => {
      if (this.model.properties.width.units == "data") {
        if (this.inherited_x && this.inherited_width) {
          return inherit
        } else {
          return this.sdist(this.renderer.xscale, this.x, this.width, "center")
        }
      } else {
        return this.inherited_width ? inherit : to_screen(this.width)
      }
    })

    this._define_or_inherit_attr<Ellipse.Data>("sheight", () => {
      if (this.model.properties.height.units == "data") {
        if (this.inherited_y && this.inherited_height) {
          return inherit
        } else {
          return this.sdist(this.renderer.yscale, this.y, this.height, "center")
        }
      } else {
        return this.inherited_height ? inherit : to_screen(this.height)
      }
    })
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<Ellipse.Data>): void {
    const {sx, sy, swidth, sheight, angle} = {...this, ...data}

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const swidth_i = swidth[i]
      const sheight_i = sheight[i]
      const angle_i = angle.get(i)

      if (!isFinite(sx_i + sy_i + swidth_i + sheight_i + angle_i)) {
        continue
      }

      ctx.beginPath()
      ctx.ellipse(sx_i, sy_i, swidth_i/2, sheight_i/2, angle_i, 0, 2*Math.PI)

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
      cond = hittest.point_in_ellipse(sx, sy, this.angle.get(i), this.sheight[i]/2, this.swidth[i]/2, this.sx[i], this.sy[i])
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

    const scale = this.swidth[index] / this.sheight[index]
    const d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.8

    const swidth: number[] = new Array(n)
    const sheight: number[] = new Array(n)
    if (scale > 1) {
      swidth[index] = d
      sheight[index] = d/scale
    } else {
      swidth[index] = d*scale
      sheight[index] = d
    }

    const angle = new p.UniformScalar(0, n) // don't attempt to match glyph angle

    this._paint(ctx, [index], {sx, sy, swidth, sheight, angle})
  }
}

export namespace Ellipse {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CenterRotatable.Props

  export type Visuals = CenterRotatable.Visuals

  export type Data = p.GlyphDataOf<Props>
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
