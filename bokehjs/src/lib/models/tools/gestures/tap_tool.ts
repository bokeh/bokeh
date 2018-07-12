import {SelectTool, SelectToolView} from "./select_tool"
import * as p from "core/properties"
import {TapEvent} from "core/ui_events"
import {isFunction} from "core/util/types"
import {PointGeometry} from "core/geometry"
import {DataSource} from "../../sources/data_source"

export class TapToolView extends SelectToolView {
  model: TapTool

  _tap(ev: TapEvent): void {
    const {sx, sy} = ev
    const geometry: PointGeometry = {
      type: 'point',
      sx: sx,
      sy: sy,
    }
    const append = ev.shiftKey
    this._select(geometry, true, append)
  }

  _select(geometry: PointGeometry, final: boolean, append: boolean): void {
    const callback = this.model.callback

    if (this.model.behavior == "select") {
      const renderers_by_source = this._computed_renderers_by_data_source()

      for (const id in renderers_by_source) {
        const renderers = renderers_by_source[id]
        const sm = renderers[0].get_selection_manager()
        const r_views = renderers.map((r) => this.plot_view.renderer_views[r.id])
        const did_hit = sm.select(r_views, geometry, final, append)

        if (did_hit && callback != null) {
          const frame = this.plot_model.frame
          const xscale = frame.xscales[renderers[0].x_range_name]
          const yscale = frame.yscales[renderers[0].y_range_name]
          const x = xscale.invert(geometry.sx)
          const y = yscale.invert(geometry.sy)
          const g = {...geometry, x, y}
          const cb_data: {
              geometries: PointGeometry & { x: number, y: number }
              source: DataSource | null,
          } = { geometries: g, source: sm.source }
          if (isFunction(callback))
            callback(this, cb_data)
          else
            callback.execute(this, cb_data)
        }
      }

      this._emit_selection_event(geometry)
      this.plot_view.push_state('tap', {selection: this.plot_view.get_selection()})
    } else {
      for (const r of this.computed_renderers) {
        const sm = r.get_selection_manager()
        const did_hit = sm.inspect(this.plot_view.renderer_views[r.id], geometry)

        if (did_hit && callback != null) {
          const frame = this.plot_model.frame
          const xscale = frame.xscales[r.x_range_name]
          const yscale = frame.yscales[r.y_range_name]
          const x = xscale.invert(geometry.sx)
          const y = yscale.invert(geometry.sy)
          const g = {...geometry, x, y}
          const cb_data: {
              geometries: PointGeometry & { x: number, y: number }
              source: DataSource | null,
          } = { geometries: g, source: sm.source }
          if (isFunction(callback))
            callback(this, cb_data)
          else
            callback.execute(this, cb_data)
        }
      }
    }
  }
}

export namespace TapTool {
  export interface Attrs extends SelectTool.Attrs {
    behavior: "select" | "inspect"
    callback: any // XXX
  }

  export interface Props extends SelectTool.Props {}
}

export interface TapTool extends TapTool.Attrs {}

export class TapTool extends SelectTool {

  properties: TapTool.Props

  constructor(attrs?: Partial<TapTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TapTool"
    this.prototype.default_view = TapToolView

    this.define({
      behavior: [ p.String, "select" ], // TODO: Enum("select", "inspect")
      callback: [ p.Any ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  tool_name = "Tap"
  icon = "bk-tool-icon-tap-select"
  event_type = "tap" as "tap"
  default_order = 10
}

TapTool.initClass()
