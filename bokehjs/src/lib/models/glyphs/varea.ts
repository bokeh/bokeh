import {PointGeometry} from "core/geometry"
import {FloatArray, ScreenArray, to_screen} from "core/types"
import {Area, AreaView, AreaData} from "./area"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export type VAreaData = AreaData & {
  _x: FloatArray
  _y1: FloatArray
  _y2: FloatArray

  sx: ScreenArray
  sy1: ScreenArray
  sy2: ScreenArray
}

export interface VAreaView extends VAreaData {}

export class VAreaView extends AreaView {
  override model: VArea
  override visuals: VArea.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = this._x[i]
      const y1 = this._y1[i]
      const y2 = this._y2[i]
      index.add_rect(x, min(y1, y2), x, max(y1, y2))
    }
  }

  protected _render(ctx: Context2d, _indices: number[], data?: VAreaData): void {
    const {sx, sy1, sy2} = data ?? this

    ctx.beginPath()
    for (let i = 0, end = sy1.length; i < end; i++) {
      ctx.lineTo(sx[i], sy1[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = sy2.length-1; i >= 0; i--) {
      ctx.lineTo(sx[i], sy2[i])
    }
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
  }

  scenterxy(i: number): [number, number] {
    const scx = this.sx[i]
    const scy = (this.sy1[i] + this.sy2[i])/2
    return [scx, scy]
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const L = this.sx.length
    const result = new Selection()

    for (let i = 0, end = L-1; i < end; i++) {
      const sx = to_screen([this.sx[i], this.sx[i+1], this.sx[i+1], this.sx[i]])
      const sy = to_screen([this.sy1[i], this.sy1[i+1], this.sy2[i+1], this.sy2[i]])

      if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices = [i]
      }
    }

    return result
  }

  //   protected override _hit_point(geometry: PointGeometry): Selection {
  //     const L = this.sx.length
  //     const sx = new ScreenArray(2*L)
  //     const sy = new ScreenArray(2*L)

  //     for (let i = 0, end = L; i < end; i++) {
  //       sx[i] = this.sx[i]
  //       sy[i] = this.sy1[i]
  //       sx[L+i] = this.sx[L-i-1]
  //       sy[L+i] = this.sy2[L-i-1]
  //     }

  //     const result = new Selection()

  //     if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
  //       result.add_to_selected_glyphs(this.model)
  //       result.view = this
  //     }

  //     return result
  //   }

  protected override _map_data(): void {
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
  override properties: VArea.Props
  override __view_type__: VAreaView

  constructor(attrs?: Partial<VArea.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VAreaView

    this.define<VArea.Props>(({}) => ({
      x:  [ p.XCoordinateSpec, {field: "x"} ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
      y2: [ p.YCoordinateSpec, {field: "y2"} ],
    }))
  }
}
