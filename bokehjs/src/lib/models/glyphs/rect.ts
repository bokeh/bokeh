import {CenterRotatable, CenterRotatableView, CenterRotatableData} from "./center_rotatable"
import {generic_area_legend} from "./utils"
import {PointGeometry, RectGeometry} from "core/geometry"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Arrayable} from "core/types"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import * as spatial from "core/util/spatial"
import {IBBox} from "core/util/bbox"
import {max} from "core/util/arrayable"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"
import {Scale} from "../scales/scale"

export interface RectData extends CenterRotatableData {
  sx0: Arrayable<number>
  sy1: Arrayable<number>
  ssemi_diag: Arrayable<number>
}

export interface RectView extends RectData {}

export class RectView extends CenterRotatableView {
  model: Rect
  visuals: Rect.Visuals

  protected _set_data(): void {
    this.max_w2 = 0
    if (this.model.properties.width.units == "data")
      this.max_w2 = this.max_width/2

    this.max_h2 = 0
    if (this.model.properties.height.units == "data")
      this.max_h2 = this.max_height/2
  }

  protected _map_data(): void {
    if (this.model.properties.width.units == "data")
      [this.sw, this.sx0] = this._map_dist_corner_for_data_side_length(this._x, this._width, this.renderer.xscale)
    else {
      this.sw = this._width

      const n = this.sx.length
      this.sx0 = new Float64Array(n)
      for (let i = 0; i < n; i++)
        this.sx0[i] = this.sx[i] - this.sw[i]/2
    }

    if (this.model.properties.height.units == "data")
      [this.sh, this.sy1] = this._map_dist_corner_for_data_side_length(this._y, this._height, this.renderer.yscale)
    else {
      this.sh = this._height

      const n =  this.sy.length
      this.sy1 = new Float64Array(n)
      for (let i = 0; i < n; i++)
        this.sy1[i] = this.sy[i] - this.sh[i]/2
    }

    const n = this.sw.length
    this.ssemi_diag = new Float64Array(n)
    for (let i = 0; i < n; i++)
      this.ssemi_diag[i] = Math.sqrt((this.sw[i]/2 * this.sw[i])/2 + (this.sh[i]/2 * this.sh[i])/2)
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, sx0, sy1, sw, sh, _angle}: RectData): void {
    if (this.visuals.fill.doit) {
      for (const i of indices) {
        if (isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i]))
          continue

        //no need to test the return value, we call fillRect for every glyph anyway
        this.visuals.fill.set_vectorize(ctx, i)

        if (_angle[i]) {
          ctx.translate(sx[i], sy[i])
          ctx.rotate(_angle[i])
          ctx.fillRect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-_angle[i])
          ctx.translate(-sx[i], -sy[i])
        } else
          ctx.fillRect(sx0[i], sy1[i], sw[i], sh[i])
      }
    }

    if (this.visuals.line.doit) {
      ctx.beginPath()

      for (const i of indices) {
        if (isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i]))
          continue

        // fillRect does not fill zero-height or -width rects, but rect(...)
        // does seem to stroke them (1px wide or tall). Explicitly ignore rects
        // with zero width or height to be consistent
        if (sw[i] == 0 || sh[i] == 0)
          continue

        if (_angle[i]) {
          ctx.translate(sx[i], sy[i])
          ctx.rotate(_angle[i])
          ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i])
          ctx.rotate(-_angle[i])
          ctx.translate(-sx[i], -sy[i])
        } else
          ctx.rect(sx0[i], sy1[i], sw[i], sh[i])

        this.visuals.line.set_vectorize(ctx, i)
        ctx.stroke()
        ctx.beginPath()
      }

      ctx.stroke()
    }
  }

  protected _hit_rect(geometry: RectGeometry): Selection {
    return this._hit_rect_against_index(geometry)
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    let {sx, sy} = geometry

    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const scenter_x = []
    for (let i = 0, end = this.sx0.length; i < end; i++) {
      scenter_x.push(this.sx0[i] + this.sw[i]/2)
    }

    const scenter_y = []
    for (let i = 0, end = this.sy1.length; i < end; i++) {
      scenter_y.push(this.sy1[i] + this.sh[i]/2)
    }

    const max_x2_ddist = max(this._ddist(0, scenter_x, this.ssemi_diag))
    const max_y2_ddist = max(this._ddist(1, scenter_y, this.ssemi_diag))

    const x0 = x - max_x2_ddist
    const x1 = x + max_x2_ddist
    const y0 = y - max_y2_ddist
    const y1 = y + max_y2_ddist

    const hits = []

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1])
    for (const i of this.index.indices(bbox)) {
      let height_in: boolean, width_in: boolean
      if (this._angle[i]) {
        const s = Math.sin(-this._angle[i])
        const c = Math.cos(-this._angle[i])
        const px = c*(sx - this.sx[i]) - s*(sy - this.sy[i]) + this.sx[i]
        const py = s*(sx - this.sx[i]) + c*(sy - this.sy[i]) + this.sy[i]
        sx = px
        sy = py
        width_in = Math.abs(this.sx[i] - sx) <= this.sw[i]/2
        height_in = Math.abs(this.sy[i] - sy) <= this.sh[i]/2
      } else {
        width_in = (sx - this.sx0[i] <= this.sw[i]) && (sx - this.sx0[i] >= 0)
        height_in = (sy - this.sy1[i] <= this.sh[i]) && (sy - this.sy1[i] >= 0)
      }

      if (height_in && width_in)
        hits.push(i)
    }

    const result = hittest.create_empty_hit_test_result()
    result.indices = hits
    return result
  }

  protected _map_dist_corner_for_data_side_length(coord: Arrayable<number>, side_length: Arrayable<number>,
                                                  scale: Scale): [Arrayable<number>, Arrayable<number>] {
    const n = coord.length

    const pt0 = new Float64Array(n)
    const pt1 = new Float64Array(n)

    for (let i = 0; i < n; i++) {
      pt0[i] = Number(coord[i]) - side_length[i]/2
      pt1[i] = Number(coord[i]) + side_length[i]/2
    }

    const spt0 = scale.v_compute(pt0)
    const spt1 = scale.v_compute(pt1)

    const sside_length = this.sdist(scale, pt0, side_length, 'edge', this.model.dilate)

    let spt_corner = spt0
    for (let i = 0, end = spt0.length; i < end; i++) {
      if (spt0[i] != spt1[i]) {
        spt_corner = spt0[i] < spt1[i] ? spt0 : spt1
        break
      }
    }

    return [sside_length, spt_corner]
  }

  protected _ddist(dim: 0 | 1, spts: Arrayable<number>, spans: Arrayable<number>): Arrayable<number> {
    const scale = dim == 0 ? this.renderer.xscale : this.renderer.yscale

    const spt0 = spts

    const m = spt0.length
    const spt1 = new Float64Array(m)
    for (let i = 0; i < m; i++)
      spt1[i] = spt0[i] + spans[i]

    const pt0 = scale.v_invert(spt0)
    const pt1 = scale.v_invert(spt1)

    const n = pt0.length
    const ddist = new Float64Array(n)
    for (let i = 0; i < n; i++)
      ddist[i] = Math.abs(pt1[i] - pt0[i])
    return ddist
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }

  protected _bounds({minX, maxX, minY, maxY}: spatial.Rect): spatial.Rect {
    return {
      minX: minX - this.max_w2,
      maxX: maxX + this.max_w2,
      minY: minY - this.max_h2,
      maxY: maxY + this.max_h2,
    }
  }
}

export namespace Rect {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends CenterRotatable.Attrs, Mixins {
    dilate: boolean
  }

  export interface Props extends CenterRotatable.Props {
    dilate: p.Property<boolean>
  }

  export interface Visuals extends CenterRotatable.Visuals {}
}

export interface Rect extends Rect.Attrs {}

export class Rect extends CenterRotatable {

  properties: Rect.Props

  constructor(attrs?: Partial<Rect.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Rect'
    this.prototype.default_view = RectView
    this.define({
      dilate: [ p.Bool,        false ],
    })
  }
}
Rect.initClass()
