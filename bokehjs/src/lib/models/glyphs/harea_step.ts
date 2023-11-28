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

export type HAreaStepData = p.GlyphDataOf<HAreaStep.Props>

export interface HAreaStepView extends HAreaStepData {}

export class HAreaStepView extends AreaView {
  declare model: HAreaStep
  declare visuals: HAreaStep.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math

    for (let i = 0; i < this.data_size; i++) {
      const x1 = this._x1[i]
      const x2 = this._x2[i]
      const y = this._y[i]
      index.add_rect(min(x1, x2), y, max(x1, x2), y)
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

  protected _render(ctx: Context2d, _indices: number[], data?: HAreaStepData): void {
    const {sx1, sx2, sy} = data ?? this

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

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx1, sx2, sy} = this

    for (let i = 0; i < this.data_size - 1; i++) {
      let px: number[]
      let py: number[]

      switch (this.model.step_mode) {
        case "before":
          px = [sy[i], sy[i+1], sy[i+1], sy[i]]
          py = [sx1[i+1], sx1[i+1], sx2[i+1], sx2[i+1]]
          break
        case "after":
          px = [sy[i], sy[i+1], sy[i+1], sy[i]]
          py = [sx1[i], sx1[i], sx2[i], sx2[i]]
          break
        case "center":
        {
          const mid_y = (sy[i] + sy[i+1]) / 2
          px = [sy[i], mid_y, mid_y, sy[i+1], sy[i+1], mid_y, mid_y, sy[i]]
          py = [sx1[i], sx1[i], sx1[i+1], sx1[i+1], sx2[i+1], sx2[i+1], sx2[i], sx2[i]]
          break
        }
      }

      if (hittest.point_in_poly(geometry.sx, geometry.sy, px, py)) {
        const result = new Selection()
        result.add_to_selected_glyphs(this.model)
        result.view = this
        result.line_indices = [i]
        return result
      }
    }

    return new Selection()
  }

  protected override _map_data(): void {
    this.sx1  = this.renderer.xscale.v_compute(this._x1)
    this.sx2 = this.renderer.xscale.v_compute(this._x2)
    this.sy = this.renderer.yscale.v_compute(this._y)
  }
}

export namespace HAreaStep {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x1: p.CoordinateSpec
    x2: p.CoordinateSpec
    y: p.CoordinateSpec
    step_mode: p.Property<StepMode>
  }

  export type Visuals = Area.Visuals
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
      x2:        [ p.YCoordinateSpec, {field: "x2"} ],
      y:         [ p.YCoordinateSpec, {field: "y"} ],
      step_mode: [ StepMode, "before" ],
    }))
  }
}
