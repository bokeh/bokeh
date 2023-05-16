import {SelectTool, SelectToolView} from "./select_tool"
import type {CallbackLike1} from "../../callbacks/callback"
import type * as p from "core/properties"
import {PartialStruct, Boolean} from "core/kinds"
import type {TapEvent} from "core/ui_events"
import type {PointGeometry} from "core/geometry"
import type {SelectionMode} from "core/enums"
import {TapBehavior, TapGesture} from "core/enums"
import type {ColumnarDataSource} from "../../sources/columnar_data_source"
import type {DataRendererView} from "../../renderers/data_renderer"
import {tool_icon_tap_select} from "styles/icons.css"

export type TapToolCallback = CallbackLike1<TapTool, {
  geometries: PointGeometry & {x: number, y: number}
  source: ColumnarDataSource
  event: {
    modifiers?: KeyModifiers
  }
}>

type KeyModifiers = typeof KeyModifiers["__type__"]
const KeyModifiers = PartialStruct({
  shift: Boolean,
  ctrl: Boolean,
  alt: Boolean,
})

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
    const {modifiers} = this.model
    if (modifiers.shift != null && modifiers.shift != ev.shift_key)
      return
    if (modifiers.ctrl != null && modifiers.ctrl != ev.ctrl_key)
      return
    if (modifiers.alt != null && modifiers.alt != ev.alt_key)
      return

    const {sx, sy} = ev
    const {frame} = this.plot_view
    if (!frame.bbox.contains(sx, sy))
      return

    this._clear_other_overlays()

    const geometry: PointGeometry = {type: "point", sx, sy}
    if (this.model.behavior == "select") {
      this._select(geometry, true, this._select_mode(ev))
    } else {
      const modifiers = {
        shift: ev.shift_key,
        ctrl: ev.ctrl_key,
        alt: ev.alt_key,
      }
      this._inspect(geometry, modifiers)
    }
  }

  protected _select(geometry: PointGeometry, final: boolean, mode: SelectionMode): void {
    const renderers_by_source = this._computed_renderers_by_data_source()

    for (const [, renderers] of renderers_by_source) {
      const sm = renderers[0].get_selection_manager()
      const r_views = renderers
        .map((r) => this.plot_view.renderer_view(r))
        .filter((rv): rv is NonNullable<DataRendererView> => rv != null)
      const did_hit = sm.select(r_views, geometry, final, mode)
      if (did_hit) {
        const [rv] = r_views
        this._emit_callback(rv, geometry, sm.source)
      }
    }

    this._emit_selection_event(geometry)
    this.plot_view.state.push("tap", {selection: this.plot_view.get_selection()})
  }

  protected _inspect(geometry: PointGeometry, modifiers?: KeyModifiers): void {
    for (const r of this.computed_renderers) {
      const rv = this.plot_view.renderer_view(r)
      if (rv == null)
        continue

      const sm = r.get_selection_manager()
      const did_hit = sm.inspect(rv, geometry)
      if (did_hit) {
        this._emit_callback(rv, geometry, sm.source, modifiers)
      }
    }
  }

  protected _emit_callback(rv: DataRendererView, geometry: PointGeometry, source: ColumnarDataSource, modifiers?: KeyModifiers): void {
    const {callback} = this.model
    if (callback != null) {
      const x = rv.coordinates.x_scale.invert(geometry.sx)
      const y = rv.coordinates.y_scale.invert(geometry.sy)
      const data = {
        geometries: {...geometry, x, y},
        source,
        event: {modifiers},
      }
      callback.execute(this.model, data)
    }
  }
}

export namespace TapTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = SelectTool.Props & {
    behavior: p.Property<TapBehavior>
    gesture: p.Property<TapGesture>
    modifiers: p.Property<KeyModifiers>
    callback: p.Property<TapToolCallback | null>
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

    this.define<TapTool.Props>(({Any, Nullable}) => ({
      behavior:  [ TapBehavior, "select" ],
      gesture:   [ TapGesture, "tap"],
      modifiers: [ KeyModifiers, {} ],
      callback:  [ Nullable(Any /*TODO*/), null ],
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
