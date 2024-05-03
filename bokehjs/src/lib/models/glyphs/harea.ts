import type {PointGeometry} from "core/geometry"
import {Area, AreaView} from "./area"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {Selection} from "../selections/selection"

export interface HAreaView extends HArea.Data {}

export class HAreaView extends AreaView {
  declare model: HArea
  declare visuals: HArea.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x1_i = this.x1[i]
      const x2_i = this.x2[i]
      const y_i = this.y[i]
      index.add_rect(min(x1_i, x2_i), y_i, max(x1_i, x2_i), y_i)
    }
  }

  protected _paint(ctx: Context2d, _indices: number[], data?: Partial<HArea.Data>): void {
    const {sx1, sx2, sy} = {...this, ...data}

    ctx.beginPath()
    for (let i = 0, end = sx1.length; i < end; i++) {
      ctx.lineTo(sx1[i], sy[i])
    }
    // iterate backwards so that the upper end is below the lower start
    for (let i = sx2.length-1; i >= 0; i--) {
      ctx.lineTo(sx2[i], sy[i])
    }
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const L = this.sy.length
    const result = new Selection()

    for (let i = 0, end = L-1; i < end; i++) {
      const sx = [this.sx1[i], this.sx1[i+1], this.sx2[i+1], this.sx2[i]]
      const sy = [this.sy[i], this.sy[i+1], this.sy[i+1], this.sy[i]]

      if (hittest.point_in_poly(geometry.sx, geometry.sy, sx, sy)) {
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices = [i]
        break
      }
    }

    return result
  }

  scenterxy(i: number): [number, number] {
    const scx = (this.sx1[i] + this.sx2[i])/2
    const scy = this.sy[i]
    return [scx, scy]
  }
}

export namespace HArea {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x1: p.XCoordinateSpec
    x2: p.XCoordinateSpec
    y: p.YCoordinateSpec
  }

  export type Visuals = Area.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface HArea extends HArea.Attrs {}

export class HArea extends Area {
  declare properties: HArea.Props
  declare __view_type__: HAreaView

  constructor(attrs?: Partial<HArea.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HAreaView

    this.define<HArea.Props>(({}) => ({
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
      x2: [ p.XCoordinateSpec, {field: "x2"} ],
      y:  [ p.YCoordinateSpec, {field: "y"} ],
    }))
  }
}
