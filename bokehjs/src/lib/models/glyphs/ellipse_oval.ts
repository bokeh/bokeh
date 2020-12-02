import {CenterRotatable, CenterRotatableView, CenterRotatableData} from "./center_rotatable"
import {PointGeometry} from "core/geometry"
import * as hittest from "core/hittest"
import {Rect} from "core/types"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import * as p from "core/properties"

export type EllipseOvalData = CenterRotatableData

export interface EllipseOvalView extends EllipseOvalData {}

export abstract class EllipseOvalView extends CenterRotatableView  {
  model: EllipseOval
  visuals: EllipseOval.Visuals

  protected _map_data(): void {
    if (this.model.properties.width.units == "data")
      this.sw = this.sdist(this.renderer.xscale, this._x, this._width, 'center')
    else
      this.sw = this._width

    if (this.model.properties.height.units == "data")
      this.sh = this.sdist(this.renderer.yscale, this._y, this._height, 'center')
    else
      this.sh = this._height
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sw, sh, _angle}: EllipseOvalData): void {
    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sw_i = sw[i]
      const sh_i = sh[i]
      const angle_i = _angle[i]

      if (isNaN(sx_i + sy_i + sw_i + sh_i + angle_i))
        continue

      ctx.beginPath()
      ctx.ellipse(sx_i, sy_i, sw_i/2.0, sh_i/2.0, angle_i, 0, 2 * Math.PI)

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
      cond = hittest.point_in_ellipse(sx, sy, this._angle[i], this.sh[i]/2, this.sw[i]/2, this.sx[i], this.sy[i])
      if (cond) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const scale = this.sw[index] / this.sh[index]
    const d = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0))*0.8

    const sw: number[] = new Array(len)
    const sh: number[] = new Array(len)
    if (scale > 1) {
      sw[index] = d
      sh[index] = d/scale
    } else {
      sw[index] = d*scale
      sh[index] = d
    }

    this._render(ctx, [index], {sx, sy, sw, sh, _angle: [0]} as any) // XXX
  }
}

export namespace EllipseOval {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CenterRotatable.Props

  export type Visuals = CenterRotatable.Visuals
}

export interface EllipseOval extends EllipseOval.Attrs {}

export abstract class EllipseOval extends CenterRotatable {
  properties: EllipseOval.Props
  __view_type__: EllipseOvalView

  constructor(attrs?: Partial<EllipseOval.Attrs>) {
    super(attrs)
  }
}
