import type {PointGeometry} from "core/geometry"
import {Area, AreaView} from "./area"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface VAreaView extends VArea.Data {}

export class VAreaView extends AreaView {
  declare model: VArea
  declare visuals: VArea.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x = this.x[i]
      const y1 = this.y1[i]
      const y2 = this.y2[i]
      index.add_rect(x, min(y1, y2), x, max(y1, y2))
    }
  }

  protected _paint(ctx: Context2d, _indices: number[], data?: Partial<VArea.Data>): void {
    const {sx, sy1, sy2} = {...this, ...data}

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
      const sx = [this.sx[i], this.sx[i+1], this.sx[i+1], this.sx[i]]
      const sy = [this.sy1[i], this.sy1[i+1], this.sy2[i+1], this.sy2[i]]

      if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices = [i]
        break
      }
    }

    return result
  }
}

export namespace VArea {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x: p.XCoordinateSpec
    y1: p.YCoordinateSpec
    y2: p.YCoordinateSpec
  }

  export type Visuals = Area.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface VArea extends VArea.Attrs {}

export class VArea extends Area {
  declare properties: VArea.Props
  declare __view_type__: VAreaView

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
