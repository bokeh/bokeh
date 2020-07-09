import {PointGeometry} from 'core/geometry'
import {Arrayable, NumberArray} from "core/types"
import {Area, AreaView, AreaData} from "./area"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface VAreaData extends AreaData {
  _x: NumberArray
  _y1: NumberArray
  _y2: NumberArray

  sx: NumberArray
  sy1: NumberArray
  sy2: NumberArray
}

export interface VAreaView extends VAreaData {}

export class VAreaView extends AreaView {
  model: VArea
  visuals: VArea.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = this._x[i]
      const y1 = this._y1[i]
      const y2 = this._y2[i]

      if (isNaN(x + y1 + y2) || !isFinite(x + y1 + y2))
        index.add_empty()
      else
        index.add(x, min(y1, y2), x, max(y1, y2))
    }
  }

  protected _inner(ctx: Context2d, sx: Arrayable<number>, sy1: Arrayable<number>, sy2: Arrayable<number>, func: (this: Context2d) => void): void {
    ctx.beginPath()
    for (let i = 0, end = sy1.length; i < end; i++) {
      ctx.lineTo(sx[i], sy1[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = sy2.length-1; i >= 0; i--) {
      ctx.lineTo(sx[i], sy2[i])
    }
    ctx.closePath()
    func.call(ctx)
  }

  protected _render(ctx: Context2d, _indices: number[], {sx, sy1, sy2}: VAreaData): void {

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_value(ctx)
      this._inner(ctx, sx, sy1, sy2, ctx.fill)
    }

    this.visuals.hatch.doit2(ctx, 0, () => this._inner(ctx, sx, sy1, sy2, ctx.fill), () => this.renderer.request_render())

  }

  scenterxy(i: number): [number, number] {
    const scx = this.sx[i]
    const scy = (this.sy1[i] + this.sy2[i])/2
    return [scx, scy]
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const L = this.sx.length
    const sx = new NumberArray(2*L)
    const sy = new NumberArray(2*L)

    for (let i = 0, end = L; i < end; i++) {
      sx[i] = this.sx[i]
      sy[i] = this.sy1[i]
      sx[L+i] = this.sx[L-i-1]
      sy[L+i] = this.sy2[L-i-1]
    }

    const result = new Selection()

    if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
      result.add_to_selected_glyphs(this.model)
      result.get_view = () => this
    }

    return result
  }

  protected _map_data(): void {
    this.sx  = this.renderer.xscale.v_compute(this._x)
    this.sy1 = this.renderer.yscale.v_compute(this._y1)
    this.sy2 = this.renderer.yscale.v_compute(this._y2)
  }
}

export namespace VArea {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x: p.CoordinateSpec
    y1: p.CoordinateSpec
    y2: p.CoordinateSpec
  }

  export type Visuals = Area.Visuals
}

export interface VArea extends VArea.Attrs {}

export class VArea extends Area {
  properties: VArea.Props
  __view_type__: VAreaView

  constructor(attrs?: Partial<VArea.Attrs>) {
    super(attrs)
  }

  static init_VArea(): void {
    this.prototype.default_view = VAreaView

    this.define<VArea.Props>({
      x:  [ p.XCoordinateSpec, {field: "x"}  ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
      y2: [ p.YCoordinateSpec, {field: "y2"} ],
    })
  }
}
