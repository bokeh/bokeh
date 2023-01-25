import {SelectTool, SelectToolView} from "./select_tool"
import {CallbackLike1} from "../../callbacks/callback"
import * as p from "core/properties"
import {TapEvent} from "core/ui_events"
import {PointGeometry} from "core/geometry"
import {TapBehavior, SelectionMode} from "core/enums"
import {ColumnarDataSource} from "../../sources/columnar_data_source"
import {DataRendererView} from "../../renderers/data_renderer"
import {tool_icon_tap_select} from "styles/icons.css"

export class TapToolView extends SelectToolView {
  declare model: TapTool

  override _tap(ev: TapEvent): void {
    if (this.model.gesture == "tap")
      this._handle_tap(ev)
  }

  override _doubletap(ev: TapEvent): void {
    if (this.model.gesture == "doubletap")
      this._handle_tap(ev)
  }

  _handle_tap(ev: TapEvent): void {
    const {sx, sy} = ev
    const geometry: PointGeometry = {type: "point", sx, sy}
    this._select(geometry, true, this._select_mode(ev))
  }

  _select(geometry: PointGeometry, final: boolean, mode: SelectionMode): void {
    const {callback} = this.model

    if (this.model.behavior == "select") {
      const renderers_by_source = this._computed_renderers_by_data_source()

      for (const [, renderers] of renderers_by_source) {
        const sm = renderers[0].get_selection_manager()
        const r_views = renderers
          .map((r) => this.plot_view.renderer_view(r))
          .filter((rv): rv is NonNullable<DataRendererView> => rv != null)
        const did_hit = sm.select(r_views, geometry, final, mode)

        if (did_hit && callback != null) {
          const x = r_views[0].coordinates.x_scale.invert(geometry.sx)
          const y = r_views[0].coordinates.y_scale.invert(geometry.sy)
          const data = {geometries: {...geometry, x, y}, source: sm.source}
          callback.execute(this.model, data)
        }
      }

      this._emit_selection_event(geometry)
      this.plot_view.state.push("tap", {selection: this.plot_view.get_selection()})
    } else {
      for (const r of this.computed_renderers) {
        const rv = this.plot_view.renderer_view(r)
        if (rv == null)
          continue

        const sm = r.get_selection_manager()
        const did_hit = sm.inspect(rv, geometry)

        if (did_hit && callback != null) {
          const x = rv.coordinates.x_scale.invert(geometry.sx)
          const y = rv.coordinates.y_scale.invert(geometry.sy)
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
    gesture: p.Property<"tap" | "doubletap">
    callback: p.Property<CallbackLike1<TapTool, {
      geometries: PointGeometry & {x: number, y: number}
      source: ColumnarDataSource
    }> | null>
  }
}

export interface TapTool extends TapTool.Attrs {}

export class TapTool extends SelectTool {
  declare properties: TapTool.Props
  declare __view_type__: TapToolView

  constructor(attrs?: Partial<TapTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TapToolView

    this.define<TapTool.Props>(({Any, Enum, Nullable}) => ({
      behavior: [ TapBehavior, "select" ],
      gesture:  [ Enum("tap", "doubletap"), "tap"],
      callback: [ Nullable(Any /*TODO*/), null ],
    }))

    this.register_alias("click", () => new TapTool({behavior: "inspect"}))
    this.register_alias("tap", () => new TapTool())
    this.register_alias("doubletap", () => new TapTool({gesture: "doubletap"}))
  }

  override tool_name = "Tap"
  override tool_icon = tool_icon_tap_select
  override event_type = "tap" as "tap"
  override default_order = 10
}
