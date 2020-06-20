import {SelectTool, SelectToolView} from "./select_tool"
import {CallbackLike1} from "../../callbacks/callback"
import * as p from "core/properties"
import {TapEvent} from "core/ui_events"
import {PointGeometry} from "core/geometry"
import {TapBehavior, SelectionMode} from "core/enums"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {bk_tool_icon_tap_select} from "styles/icons"

export class TapToolView extends SelectToolView {
  model: TapTool

  _tap(ev: TapEvent): void {
    const {sx, sy} = ev
    const geometry: PointGeometry = {type: "point", sx, sy}
    this._select(geometry, true, this._select_mode(ev))
  }

  _select(geometry: PointGeometry, final: boolean, mode: SelectionMode): void {
    const callback = this.model.callback

    if (this.model.behavior == "select") {
      const renderers_by_source = this._computed_renderers_by_data_source()

      for (const [, renderers] of renderers_by_source) {
        const sm = renderers[0].get_selection_manager()
        const r_views = renderers.map((r) => this.plot_view.renderer_views.get(r)!)
        const did_hit = sm.select(r_views, geometry, final, mode)

        if (did_hit && callback != null) {
          const x = r_views[0].scope.x_scale.invert(geometry.sx)
          const y = r_views[0].scope.y_scale.invert(geometry.sy)
          const data = {geometries: {...geometry, x, y}, source: sm.source}
          callback.execute(this.model, data)
        }
      }

      this._emit_selection_event(geometry)
      this.plot_view.push_state('tap', {selection: this.plot_view.get_selection()})
    } else {
      for (const r of this.computed_renderers) {
        const rv = this.plot_view.renderer_views.get(r)!
        const sm = r.get_selection_manager()
        const did_hit = sm.inspect(rv, geometry)

        if (did_hit && callback != null) {
          const x = rv.scope.x_scale.invert(geometry.sx)
          const y = rv.scope.y_scale.invert(geometry.sy)
          const data = {geometries: {...geometry, x, y}, source: sm.source}
          callback.execute(this.model, data)
        }
      }
    }
  }
}

export namespace TapTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    behavior: p.Property<TapBehavior>
    callback: p.Property<CallbackLike1<TapTool, {
      geometries: PointGeometry & {x: number, y: number}
      source: ColumnarDataSource
    }> | null>
  }
}

export interface TapTool extends TapTool.Attrs {}

export class TapTool extends SelectTool {
  properties: TapTool.Props
  __view_type__: TapToolView

  constructor(attrs?: Partial<TapTool.Attrs>) {
    super(attrs)
  }

  static init_TapTool(): void {
    this.prototype.default_view = TapToolView

    this.define<TapTool.Props>({
      behavior: [ p.TapBehavior, "select" ],
      callback: [ p.Any                   ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })

    this.register_alias("click", () => new TapTool({behavior: "inspect"}))
    this.register_alias("tap", () => new TapTool())
  }

  tool_name = "Tap"
  icon = bk_tool_icon_tap_select
  event_type = "tap" as "tap"
  default_order = 10
}
