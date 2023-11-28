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

export interface VAreaStepView extends VAreaStep.Data {}

export class VAreaStepView extends AreaView {
  declare model: VAreaStep
  declare visuals: VAreaStep.Visuals

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math

    for (let i = 0; i < this.data_size; i++) {
      const x = this._x[i]
      const y1 = this._y1[i]
      const y2 = this._y2[i]
      index.add_rect(x, min(y1, y2), x, max(y1, y2))
    }
  }

  protected _step_path(ctx: Context2d, mode: StepMode, sx: Arrayable<number>, sy: Arrayable<number>, from_i: number, to_i: number): void {
    // Assume the path was already moved to the first point
    let prev_x = sx[from_i]
    let prev_y = sy[from_i]
    const idx_dir = from_i < to_i ? 1 : -1
    for (let i = from_i + idx_dir; i != to_i; i += idx_dir) {
      switch (mode) {
        case "before":
          ctx.lineTo(prev_x, sy[i])
          ctx.lineTo(sx[i], sy[i])
          break
        case "after":
          ctx.lineTo(sx[i], prev_y)
          ctx.lineTo(sx[i], sy[i])
          break
        case "center":
        {
          const mid_x = (prev_x + sx[i]) / 2
          ctx.lineTo(mid_x, prev_y)
          ctx.lineTo(mid_x, sy[i])
          ctx.lineTo(sx[i], sy[i])
          break
        }
      }
      prev_x = sx[i]
      prev_y = sy[i]
    }
  }

  protected _render(ctx: Context2d, _indices: number[], data?: VAreaStep.Data): void {
    const {sx, sy1, sy2} = data ?? this

    const forward_mode = this.model.step_mode
    const backward_mode = flip_step_mode(this.model.step_mode)

    ctx.beginPath()
    ctx.moveTo(sx[0], sy1[0])

    this._step_path(ctx, forward_mode, sx, sy1, 0, sx.length)
    this._step_path(ctx, backward_mode, sx, sy2, sx.length, -1)

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
    const {sx, sy1, sy2} = this

    for (let i = 0; i < this.data_size - 1; i++) {
      let px: number[]
      let py: number[]

      switch (this.model.step_mode) {
        case "before":
          px = [sx[i], sx[i+1], sx[i+1], sx[i]]
          py = [sy1[i+1], sy1[i+1], sy2[i+1], sy2[i+1]]
          break
        case "after":
          px = [sx[i], sx[i+1], sx[i+1], sx[i]]
          py = [sy1[i], sy1[i], sy2[i], sy2[i]]
          break
        case "center":
        {
          const mid_x = (sx[i] + sx[i+1]) / 2
          px = [sx[i], mid_x, mid_x, sx[i+1], sx[i+1], mid_x, mid_x, sx[i]]
          py = [sy1[i], sy1[i], sy1[i+1], sy1[i+1], sy2[i+1], sy2[i+1], sy2[i], sy2[i]]
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
    this.sx  = this.renderer.xscale.v_compute(this._x)
    this.sy1 = this.renderer.yscale.v_compute(this._y1)
    this.sy2 = this.renderer.yscale.v_compute(this._y2)
  }
}

export namespace VAreaStep {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Area.Props & {
    x: p.CoordinateSpec
    y1: p.CoordinateSpec
    y2: p.CoordinateSpec
    step_mode: p.Property<StepMode>
  }

  export type Visuals = Area.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface VAreaStep extends VAreaStep.Attrs {}

export class VAreaStep extends Area {
  declare properties: VAreaStep.Props
  declare __view_type__: VAreaStepView

  constructor(attrs?: Partial<VAreaStep.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VAreaStepView

    this.define<VAreaStep.Props>(({}) => ({
      x:         [ p.XCoordinateSpec, {field: "x"} ],
      y1:        [ p.YCoordinateSpec, {field: "y1"} ],
      y2:        [ p.YCoordinateSpec, {field: "y2"} ],
      step_mode: [ StepMode, "before" ],
    }))
  }
}
