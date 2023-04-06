import {Marker, MarkerView, MarkerData} from "./marker"
import {marker_funcs} from "./defs"
import {MarkerType} from "core/enums"
import {Rect} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export type ScatterData = MarkerData & {
  readonly marker: p.Uniform<MarkerType | null>
}

export interface ScatterView extends ScatterData {}

export class ScatterView extends MarkerView {
  declare model: Scatter

  /** @internal */
  declare glglyph?: import("./webgl/multi_marker").MultiMarkerGL

  override async load_glglyph() {
    const {MultiMarkerGL} = await import("./webgl/multi_marker")
    return MultiMarkerGL
  }

  protected override _render(ctx: Context2d, indices: number[], data?: ScatterData): void {
    const {sx, sy, size, angle, marker} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = size.get(i)
      const angle_i = angle.get(i)
      const marker_i = marker.get(i)

      if (!isFinite(sx_i + sy_i + size_i + angle_i) || marker_i == null)
        continue

      const r = size_i/2

      ctx.beginPath()
      ctx.translate(sx_i, sy_i)

      if (angle_i != 0) {
        ctx.rotate(angle_i)
      }

      marker_funcs[marker_i](ctx, i, r, this.visuals)

      if (angle_i != 0) {
        ctx.rotate(-angle_i)
      }

      ctx.translate(-sx_i, -sy_i)
    }
  }

  override draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: Rect, index: number): void {
    const n = index + 1
    const marker = this.marker.get(index)

    const args = {
      ...this._get_legend_args({x0, x1, y0, y1}, index),
      marker: new p.UniformScalar(marker, n),
    }

    this._render(ctx, [index], args)
  }
}

export namespace Scatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Marker.Props & {
    marker: p.MarkerSpec
  }
}

export interface Scatter extends Scatter.Attrs {}

export class Scatter extends Marker {
  declare properties: Scatter.Props
  declare __view_type__: ScatterView

  constructor(attrs?: Partial<Scatter.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ScatterView
    this.define<Scatter.Props>(() => ({
      marker: [ p.MarkerSpec, {value: "circle"} ],
    }))
  }
}
