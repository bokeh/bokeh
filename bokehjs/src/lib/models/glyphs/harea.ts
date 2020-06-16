import {PointGeometry} from 'core/geometry'
import {Arrayable} from "core/types"
import {Area, AreaView, AreaData} from "./area"
import {Context2d} from "core/util/canvas"
import {SpatialIndex, IndexedRect} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface HAreaData extends AreaData {
  _x1: Arrayable<number>
  _x2: Arrayable<number>
  _y: Arrayable<number>

  sx1: Arrayable<number>
  sx2: Arrayable<number>
  sy: Arrayable<number>
}

export interface HAreaView extends HAreaData {}

export class HAreaView extends AreaView {
  model: HArea
  visuals: HArea.Visuals

  protected _index_data(): SpatialIndex {
    const points: IndexedRect[] = []

    for (let i = 0, end = this._x1.length; i < end; i++) {
      const x1 = this._x1[i]
      const x2 = this._x2[i]
      const y = this._y[i]

      if (isNaN(x1 + x2 + y) || !isFinite(x1 + x2 + y))
        continue

      points.push({x0: Math.min(x1, x2), y0: y, x1: Math.max(x1, x2), y1: y, i})
    }

    return new SpatialIndex(points)
  }

  protected _inner(ctx: Context2d, sx1: Arrayable<number>, sx2: Arrayable<number>, sy: Arrayable<number>, func: (this: Context2d) => void): void {
    ctx.beginPath()
    for (let i = 0, end = sx1.length; i < end; i++) {
      ctx.lineTo(sx1[i], sy[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = sx2.length-1; i >= 0; i--) {
      ctx.lineTo(sx2[i], sy[i])
    }
    ctx.closePath()
    func.call(ctx)
  }

  protected _render(ctx: Context2d, _indices: number[], {sx1, sx2, sy}: HAreaData): void {

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      this._inner(ctx, sx1, sx2, sy, ctx.fill)
    }

    this.visuals.hatch.doit2(ctx, 0, () => this._inner(ctx, sx1, sx2, sy, ctx.fill), () => this.renderer.request_render())

  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const L = this.sy.length
    const sx = new Float64Array(2*L)
    const sy = new Float64Array(2*L)

    for (let i = 0, end = L; i < end; i++) {
      sx[i] = this.sx1[i]
      sy[i] = this.sy[i]
      sx[L+i] = this.sx2[L-i-1]
      sy[L+i] = this.sy[L-i-1]
    }

    const result = new Selection()

    if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
      result.add_to_selected_glyphs(this.model)
      result.get_view = () => this
    }

    return result
  }

  scenterx(i: number): number {
    return (this.sx1[i] + this.sx2[i])/2
  }

  scentery(i: number): number {
    return this.sy[i]
  }

  protected _map_data(): void {
    this.sx1 = this.renderer.xscale.v_compute(this._x1)
    this.sx2 = this.renderer.xscale.v_compute(this._x2)
    this.sy  = this.renderer.yscale.v_compute(this._y)
  }
}

export namespace HArea {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x1: p.CoordinateSpec
    x2: p.CoordinateSpec
    y: p.CoordinateSpec
  }

  export type Visuals = Area.Visuals
}

export interface HArea extends HArea.Attrs {}

export class HArea extends Area {
  properties: HArea.Props
  __view_type__: HAreaView

  constructor(attrs?: Partial<HArea.Attrs>) {
    super(attrs)
  }

  static init_HArea(): void {
    this.prototype.default_view = HAreaView

    this.define<HArea.Props>({
      x1: [ p.CoordinateSpec ],
      x2: [ p.CoordinateSpec ],
      y:  [ p.CoordinateSpec ],
    })
  }
}
