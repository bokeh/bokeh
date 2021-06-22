import {Marker, MarkerView, MarkerData} from "./marker"
import {marker_funcs} from "./defs"
import {MarkerType} from "core/enums"
import {Rect} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export type ScatterData = MarkerData & {
  readonly marker: p.Uniform<MarkerType>
}

export interface ScatterView extends ScatterData {}

export class ScatterView extends MarkerView {
  override model: Scatter

  /** @internal */
  override glglyph?: import("./webgl/markers").MarkerGL
  private glcls?: typeof import("./webgl/markers").MarkerGL

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {MarkerGL} = await import("./webgl/markers")
    this.glcls = MarkerGL
  }

  protected _init_webgl(): void {
    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null) {
      const {regl_wrapper} = webgl
      if (regl_wrapper.has_webgl) {
        const marker_types = new Set(this.base != null ? this.base.marker : this.marker)
        if (marker_types.size == 1) {
          const [marker_type] = [...marker_types]

          const MarkerGL = this.glcls
          if (MarkerGL?.is_supported(marker_type)) {
            const {glglyph} = this
            if (glglyph == null || glglyph.marker_type != marker_type) {
              this.glglyph = new MarkerGL(regl_wrapper, this, marker_type)
              return
            }
          }
        }
      }
    }
    delete this.glglyph
  }

  protected override _set_visuals(): void {
    this._init_webgl()
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

      if (angle_i)
        ctx.rotate(angle_i)

      marker_funcs[marker_i](ctx, i, r, this.visuals)

      if (angle_i)
        ctx.rotate(-angle_i)

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
  override properties: Scatter.Props
  override __view_type__: ScatterView

  constructor(attrs?: Partial<Scatter.Attrs>) {
    super(attrs)
  }

  static init_Scatter(): void {
    this.prototype.default_view = ScatterView
    this.define<Scatter.Props>(() => ({
      marker: [ p.MarkerSpec, {value: "circle"} ],
    }))
  }
}
