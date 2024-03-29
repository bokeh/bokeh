import type {PointGeometry} from "core/geometry"
import type {Arrayable} from "core/types"
import {Area, AreaView} from "./area"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {StepMode} from "core/enums"
import {flip_step_mode} from "core/util/flip_step_mode"
import {Selection} from "../selections/selection"

export interface HAreaStepView extends HAreaStep.Data {}

export class HAreaStepView extends AreaView {
  declare model: HAreaStep
  declare visuals: HAreaStep.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {x1, x2, y} = this

    for (let i = 0; i < this.data_size; i++) {
      const x1_i = x1[i]
      const x2_i = x2[i]
      const y_i = y[i]
      index.add_rect(min(x1_i, x2_i), y_i, max(x1_i, x2_i), y_i)
    }
  }

  protected _step_path(ctx: Context2d, mode: StepMode, sx: Arrayable<number>, sy: Arrayable<number>, from_i: number, to_i: number): void {
    // Assume the path was already moved to the first point
    let prev_x = sx[from_i]
    let prev_y = sy[from_i]
    const idx_dir = from_i < to_i ? 1 : -1
    for (let i = from_i + idx_dir; i != to_i; i += idx_dir) {
      switch (mode) {
        case "before": {
          ctx.lineTo(sx[i], prev_y)
          ctx.lineTo(sx[i], sy[i])
          break
        }
        case "after": {
          ctx.lineTo(prev_x, sy[i])
          ctx.lineTo(sx[i], sy[i])
          break
        }
        case "center": {
          const mid_y = (prev_y + sy[i]) / 2
          ctx.lineTo(prev_x, mid_y)
          ctx.lineTo(sx[i], mid_y)
          ctx.lineTo(sx[i], sy[i])
          break
        }
      }
      prev_x = sx[i]
      prev_y = sy[i]
    }
  }

  protected _paint(ctx: Context2d, _indices: number[], data?: Partial<HAreaStep.Data>): void {
    const {sx1, sx2, sy} = {...this, ...data}

    const forward_mode = this.model.step_mode
    const backward_mode = flip_step_mode(this.model.step_mode)

    ctx.beginPath()
    ctx.moveTo(sx1[0], sy[0])

    this._step_path(ctx, forward_mode, sx1, sy, 0, sy.length)
    this._step_path(ctx, backward_mode, sx2, sy, sy.length, -1)

    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
  }

  scenterxy(i: number): [number, number] {
    const scx = (this.sx1[i] + this.sx2[i]) / 2
    const scy = this.sy[i]
    return [scx, scy]
  }

  protected _line_selection_for(i: number): Selection {
    return new Selection({line_indices: [i], selected_glyphs: [this.model], view: this})
  }

  protected _hit_point_before(geometry: PointGeometry): Selection {
    const {sy, sx1, sx2} = this
    for (let i = 1; i < this.data_size; i++) {
      const px = [sx1[i], sx1[i], sx2[i], sx2[i]]
      const py = [sy[i-1], sy[i], sy[i], sy[i-1]]
      if (hittest.point_in_poly(geometry.sx, geometry.sy, px, py)) {
        return this._line_selection_for(i)
      }
    }
    return new Selection()
  }

  protected _hit_point_after(geometry: PointGeometry): Selection {
    const {sy, sx1, sx2} = this
    for (let i = 0; i < this.data_size - 1; i++) {
      const px = [sx1[i], sx1[i], sx2[i], sx2[i]]
      const py = [sy[i], sy[i+1], sy[i+1], sy[i]]
      if (hittest.point_in_poly(geometry.sx, geometry.sy, px, py)) {
        return this._line_selection_for(i)
      }
    }
    return new Selection()
  }

  protected _hit_point_center(geometry: PointGeometry): Selection {
    const {sy, sx1, sx2} = this

    for (let i = 0; i < this.data_size; i++) {
      const mid_prev_y = (sy[i - 1] + sy[i])/2 /* undefined for first */
      const mid_next_y = (sy[i] + sy[i + 1])/2 /* undefined for last  */

      const px = [sx1[i], sx1[i], sx2[i], sx2[i]]
      const py = (() => {
        if (i == 0) {
          return [sy[i], mid_next_y, mid_next_y, sy[i]]
        } else if (i == this.data_size - 1) {
          return [mid_prev_y, sy[i], sy[i], mid_prev_y]
        } else {
          return [mid_prev_y, mid_next_y, mid_next_y, mid_prev_y]
        }
      })()

      if (hittest.point_in_poly(geometry.sx, geometry.sy, px, py)) {
        return this._line_selection_for(i)
      }
    }
    return new Selection()
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    switch (this.model.step_mode) {
      case "before": return this._hit_point_before(geometry)
      case "after":  return this._hit_point_after(geometry)
      case "center": return this._hit_point_center(geometry)
    }
  }
}

export namespace HAreaStep {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x1: p.XCoordinateSpec
    x2: p.XCoordinateSpec
    y: p.YCoordinateSpec
    step_mode: p.Property<StepMode>
  }

  export type Visuals = Area.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface HAreaStep extends HAreaStep.Attrs {}

export class HAreaStep extends Area {
  declare properties: HAreaStep.Props
  declare __view_type__: HAreaStepView

  constructor(attrs?: Partial<HAreaStep.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HAreaStepView

    this.define<HAreaStep.Props>(({}) => ({
      x1:        [ p.XCoordinateSpec, {field: "x1"} ],
      x2:        [ p.XCoordinateSpec, {field: "x2"} ],
      y:         [ p.YCoordinateSpec, {field: "y"} ],
      step_mode: [ StepMode, "before" ],
    }))
  }
}
