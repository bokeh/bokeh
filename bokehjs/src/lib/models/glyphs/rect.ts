import {CenterRotatable, CenterRotatableView, CenterRotatableData} from "./center_rotatable"
import {generic_area_vector_legend} from "./utils"
import {PointGeometry, RectGeometry} from "core/geometry"
import {Arrayable, FloatArray, ScreenArray, to_screen, infer_type} from "core/types"
import * as types from "core/types"
import * as p from "core/properties"
import {max} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import {Scale} from "../scales/scale"
import {BBox, Corners} from "core/util/bbox"
import {rotate_around} from "core/util/affine"
import {BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"

const {abs, sqrt} = Math

export type RectData = CenterRotatableData & {
  sx0: ScreenArray
  sy1: ScreenArray
  ssemi_diag: ScreenArray
  max_x2_ddist: number
  max_y2_ddist: number
  border_radius: Corners<number>
}

export interface RectView extends RectData {}

export class RectView extends CenterRotatableView {
  declare model: Rect
  declare visuals: Rect.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/rect").RectGL

  override async load_glglyph() {
    const {RectGL} = await import("./webgl/rect")
    return RectGL
  }

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)
    this.border_radius = resolve.border_radius(this.model.border_radius)
  }

  protected override _map_data(): void {
    const n = this.data_size

    if (this.model.properties.width.units == "data")
      [this.sw, this.sx0] = this._map_dist_corner_for_data_side_length(this._x, this.width, this.renderer.xscale)
    else {
      this.sw = to_screen(this.width)

      this.sx0 = new ScreenArray(n)
      for (let i = 0; i < n; i++) {
        this.sx0[i] = this.sx[i] - this.sw[i]/2
      }
    }

    if (this.model.properties.height.units == "data")
      [this.sh, this.sy1] = this._map_dist_corner_for_data_side_length(this._y, this.height, this.renderer.yscale)
    else {
      this.sh = to_screen(this.height)

      this.sy1 = new ScreenArray(n)
      for (let i = 0; i < n; i++) {
        this.sy1[i] = this.sy[i] - this.sh[i]/2
      }
    }

    const {sw, sh} = this
    this.ssemi_diag = new ScreenArray(n)

    for (let i = 0; i < n; i++) {
      const sw_i = sw[i]
      const sh_i = sh[i]
      this.ssemi_diag[i] = sqrt(sw_i**2 + sh_i**2)/2
    }

    const scenter_x = new ScreenArray(n)
    const scenter_y = new ScreenArray(n)

    for (let i = 0; i < n; i++) {
      scenter_x[i] = this.sx0[i] + this.sw[i]/2
      scenter_y[i] = this.sy1[i] + this.sh[i]/2
    }

    this.max_x2_ddist = max(this._ddist(0, scenter_x, this.ssemi_diag))
    this.max_y2_ddist = max(this._ddist(1, scenter_y, this.ssemi_diag))
  }

  protected _render(ctx: Context2d, indices: number[], data?: RectData): void {
    const {sx, sy, sx0, sy1, sw, sh, angle, border_radius} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sx0_i = sx0[i]
      const sy1_i = sy1[i]
      const sw_i = sw[i]
      const sh_i = sh[i]
      const angle_i = angle.get(i)

      if (!isFinite(sx_i + sy_i + sx0_i + sy1_i + sw_i + sh_i + angle_i))
        continue

      if (sw_i == 0 || sh_i == 0)
        continue

      ctx.beginPath()
      if (angle_i != 0) {
        ctx.translate(sx_i, sy_i)
        ctx.rotate(angle_i)
        const box = new BBox({x: -sw_i/2, y: -sh_i/2, width: sw_i, height: sh_i})
        round_rect(ctx, box, border_radius)
        ctx.rotate(-angle_i)
        ctx.translate(-sx_i, -sy_i)
      } else {
        const box = new BBox({x: sx0_i, y: sy1_i, width: sw_i, height: sh_i})
        round_rect(ctx, box, border_radius)
      }

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    return this._hit_rect_against_index(geometry)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const hit_xy = {x: geometry.sx, y: geometry.sy}

    const x = this.renderer.xscale.invert(hit_xy.x)
    const y = this.renderer.yscale.invert(hit_xy.y)

    const candidates = this.index.indices({
      x0: x - this.max_x2_ddist,
      x1: x + this.max_x2_ddist,
      y0: y - this.max_y2_ddist,
      y1: y + this.max_y2_ddist,
    })

    const {sx, sy, sx0, sy1, sw, sh, angle} = this
    const indices = []

    for (const i of candidates) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sx0_i = sx0[i]
      const sy1_i = sy1[i]
      const sw_i = sw[i]
      const sh_i = sh[i]
      const angle_i = angle.get(i)

      const hit_rxy = rotate_around(hit_xy, {x: sx_i, y: sy_i}, -angle_i)

      const x = hit_rxy.x - sx0_i
      const y = hit_rxy.y - sy1_i

      // TODO: consider round corners
      if (0 <= x && x <= sw_i && 0 <= y && y <= sh_i) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }

  protected _map_dist_corner_for_data_side_length(coord: Arrayable<number>, side_length: p.Uniform<number>,
                                                  scale: Scale): [ScreenArray, ScreenArray] {
    const n = coord.length

    const pt0 = new Float64Array(n)
    const pt1 = new Float64Array(n)

    for (let i = 0; i < n; i++) {
      const coord_i = coord[i]
      const half_side_length_i = side_length.get(i)/2
      pt0[i] = coord_i - half_side_length_i
      pt1[i] = coord_i + half_side_length_i
    }

    const spt0 = scale.v_compute(pt0)
    const spt1 = scale.v_compute(pt1)

    const sside_length = this.sdist(scale, pt0, side_length, "edge", this.model.dilate)

    let spt_corner = spt0
    for (let i = 0; i < n; i++) {
      const spt0i = spt0[i]
      const spt1i = spt1[i]
      if (!isNaN(spt0i + spt1i) && spt0i != spt1i) {
        spt_corner = spt0i < spt1i ? spt0 : spt1
        break
      }
    }

    return [sside_length, spt_corner]
  }

  protected _ddist(dim: 0 | 1, spts: FloatArray, spans: FloatArray): FloatArray {
    const ArrayType = infer_type(spts, spans)

    const scale = dim == 0 ? this.renderer.xscale : this.renderer.yscale
    const spt0 = spts

    const m = spt0.length
    const spt1 = new ArrayType(m)
    for (let i = 0; i < m; i++)
      spt1[i] = spt0[i] + spans[i]

    const pt0 = scale.v_invert(spt0)
    const pt1 = scale.v_invert(spt1)

    const n = pt0.length
    const ddist = new ArrayType(n)
    for (let i = 0; i < n; i++)
      ddist[i] = abs(pt1[i] - pt0[i])
    return ddist
  }

  override draw_legend_for_index(ctx: Context2d, bbox: types.Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace Rect {
  export type Attrs = p.AttrsOf<Props>

  export type Props = CenterRotatable.Props & {
    border_radius: p.Property<BorderRadius>
    dilate: p.Property<boolean>
  }

  export type Visuals = CenterRotatable.Visuals
}

export interface Rect extends Rect.Attrs {}

export class Rect extends CenterRotatable {
  declare properties: Rect.Props
  declare __view_type__: RectView

  constructor(attrs?: Partial<Rect.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = RectView
    this.define<Rect.Props>(({Boolean}) => ({
      border_radius: [ BorderRadius, 0 ],
      dilate: [ Boolean, false ],
    }))
  }
}
