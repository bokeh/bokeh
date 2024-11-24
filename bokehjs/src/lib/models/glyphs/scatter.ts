import {Marker, MarkerView} from "./marker"
import {MarkerType} from "core/enums"
import {marker_funcs} from "./defs"
import type {VectorVisuals} from "./defs"
import type {Rect, KeyVal} from "core/types"
import * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import type {MultiMarkerGL} from "./webgl/multi_marker"
import {CustomJS} from "../callbacks/customjs"
import {execute_sync} from "core/util/callbacks"
import type {SyncExecutableLike} from "core/util/callbacks"
import {dict} from "core/util/object"

function is_MarkerType(type: string): type is MarkerType {
  return MarkerType.valid(type)
}

export interface ScatterView extends Scatter.Data {}

export class ScatterView extends MarkerView {
  declare model: Scatter

  /** @internal */
  declare glglyph?: MultiMarkerGL

  override async load_glglyph() {
    const {MultiMarkerGL} = await import("./webgl/multi_marker")
    return MultiMarkerGL
  }

  protected async _update_defs(): Promise<void> {
    for (const cb of dict(this.model.defs).values()) {
      if (cb instanceof CustomJS) {
        await cb.compile()
      }
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    const {defs} = this.model.properties
    this.on_change(defs, () => this._update_defs())
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._update_defs()
  }

  protected override _paint(ctx: Context2d, indices: number[], data?: Partial<Scatter.Data>): void {
    const {sx, sy, size, angle, marker} = {...this, ...data}
    const defs = dict(this.model.defs)
    const {visuals} = this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const size_i = size.get(i)
      const angle_i = angle.get(i)
      const marker_i = marker.get(i)

      if (!isFinite(sx_i + sy_i + size_i + angle_i) || marker_i == null) {
        continue
      }

      ctx.beginPath()
      ctx.translate(sx_i, sy_i)

      if (angle_i != 0) {
        ctx.rotate(angle_i)
      }

      const r = size_i/2

      if (is_MarkerType(marker_i)) {
        marker_funcs[marker_i](ctx, i, r, visuals)
      } else {
        const fn = defs.get(marker_i)
        if (fn != null) {
          const path = execute_sync(fn as CustomMarkerDef, this.model, {ctx, i, r, visuals})
          if (path instanceof Path2D) {
            this.visuals.fill.apply(ctx, i, path)
            this.visuals.hatch.apply(ctx, i, path)
            this.visuals.line.apply(ctx, i, path)
          }
        }
      }

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

    this._paint(ctx, [index], args)
  }
}

type CustomMarkerDef = SyncExecutableLike<Scatter, [{ctx: Context2d, i: number, r: number, visuals: VectorVisuals}], void | Path2D>

export namespace Scatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Marker.Props & {
    marker: p.MarkerSpec
    defs: p.Property<KeyVal<p.ExtMarkerType, CustomMarkerDef | CustomJS>>
  }

  export type Visuals = Marker.Visuals

  export type Data = p.GlyphDataOf<Props>
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
    this.define<Scatter.Props>(({KeyVal, Or, Func, Ref}) => ({
      marker: [ p.MarkerSpec, {value: "circle"} ],
      defs: [ KeyVal(p.ExtMarkerType, Or(Func(), Ref(CustomJS)) as any), {} ],
    }))
  }
}
