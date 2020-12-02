import {Marker, MarkerView, MarkerData} from "./marker"
import {marker_funcs} from "./defs"
import {MarkerGL} from "./webgl/markers"
import {MarkerType} from "core/enums"
import {Arrayable, Rect} from "core/types"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export type ScatterData = MarkerData & {
  _marker: Arrayable<MarkerType> /* | MarkerType */
}

export interface ScatterView extends ScatterData {}

export class ScatterView extends MarkerView {
  model: Scatter

  /** @internal */
  glglyph?: MarkerGL

  protected _init_webgl(): void {
    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null) {
      const marker_types = new Set(this._marker)
      if (marker_types.size == 1) {
        const [marker_type] = [...marker_types]

        if (MarkerGL.is_supported(marker_type)) {
          const {glglyph} = this
          if (glglyph == null || glglyph.marker_type != marker_type) {
            this.glglyph = new MarkerGL(webgl.gl, this, marker_type)
            return
          }
        }
      }
    }
    delete this.glglyph
  }

  protected _set_data(indices: number[] | null): void {
    super._set_data(indices)
    this._init_webgl()
  }

  protected _render(ctx: Context2d, indices: number[], {sx, sy, _size, _angle, _marker}: ScatterData): void {
    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = _size[i]
      const angle_i = _angle[i]
      const marker_i = _marker[i]

      if (isNaN(sx_i + sy_i + size_i + angle_i) || marker_i == null)
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

  draw_legend_for_index(ctx: Context2d, {x0, x1, y0, y1}: Rect, index: number): void {
    const args = this._get_legend_args({x0, x1, y0, y1}, index)

    const len = index + 1
    const marker: string[] = new Array(len)
    marker[index] = this._marker[index]
    args._marker = marker

    this._render(ctx, [index], args) // XXX
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
  properties: Scatter.Props
  __view_type__: ScatterView

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
