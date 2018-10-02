import {GestureTool, GestureToolView} from "./gesture_tool"
import {GraphRenderer} from "../../renderers/graph_renderer"
import {compute_renderers, DataRenderer, RendererSpec} from "../util"
import * as p from "core/properties"
import {KeyEvent} from "core/ui_events"
import {Keys} from "core/dom"
import {SelectionGeometry} from "core/bokeh_events"
import {Geometry} from "core/geometry"

export abstract class SelectToolView extends GestureToolView {
  model: SelectTool

  get computed_renderers(): DataRenderer[] {
    const renderers = this.model.renderers
    const all_renderers = this.plot_model.plot.renderers
    const names = this.model.names
    return compute_renderers(renderers, all_renderers, names)
  }

  _computed_renderers_by_data_source(): {[key: string]: DataRenderer[]} {
    const renderers_by_source: {[key: string]: DataRenderer[]} = {}
    for (const r of this.computed_renderers) {
      let source_id: string
      // XXX: needs typings for renderers
      if (r instanceof GraphRenderer)
        source_id = (r as any).node_renderer.data_source.id
      else
        source_id = (r as any).data_source.id

      if (!(source_id in renderers_by_source))
        renderers_by_source[source_id] = []

      renderers_by_source[source_id].push(r)
    }

    return renderers_by_source
  }

  _keyup(ev: KeyEvent): void {
    if (ev.keyCode == Keys.Esc) {
      for (const r of this.computed_renderers) {
        // XXX: needs typings for renderers
        const ds = (r as any).data_source
        const sm = ds.selection_manager
        sm.clear()
      }
      this.plot_view.request_render()
    }
  }

  _select(geometry: Geometry, final: boolean, append: boolean): void {
    const renderers_by_source = this._computed_renderers_by_data_source()

    for (const id in renderers_by_source) {
      const renderers = renderers_by_source[id]
      const sm = renderers[0].get_selection_manager()

      const r_views = []
      for (const r of renderers) {
        if (r.id in this.plot_view.renderer_views)
          r_views.push(this.plot_view.renderer_views[r.id])
      }
      sm.select(r_views, geometry, final, append)
    }

    // XXX: messed up class structure
    if ((this.model as any).callback != null)
      (this as any)._emit_callback(geometry)

    this._emit_selection_event(geometry, final)
  }

  _emit_selection_event(geometry: Geometry, final: boolean = true): void {
    const xm = this.plot_model.frame.xscales['default']
    const ym = this.plot_model.frame.yscales['default']
    let g: any // XXX: Geometry & something
    switch (geometry.type) {
      case 'point': {
        const {sx, sy} = geometry
        const x = xm.invert(sx)
        const y = ym.invert(sy)
        g = {...geometry, x, y}
        break
      }
      case 'rect': {
        const {sx0, sx1, sy0, sy1} = geometry
        const [x0, x1] = xm.r_invert(sx0, sx1)
        const [y0, y1] = ym.r_invert(sy0, sy1)
        g = {...geometry, x0, y0, x1, y1}
        break
      }
      case 'poly': {
        const {sx, sy} = geometry
        const x = xm.v_invert(sx)
        const y = ym.v_invert(sy)
        g = {...geometry, x, y}
        break
      }
      default:
        throw new Error(`Unrecognized selection geometry type: '${geometry.type}'`)
    }

    this.plot_model.plot.trigger_event(new SelectionGeometry({geometry: g, final: final}))
  }
}

export namespace SelectTool {
  export interface Attrs extends GestureTool.Attrs {
    renderers: RendererSpec
    names: string[]
  }

  export interface Props extends GestureTool.Props {}
}

export interface SelectTool extends SelectTool.Attrs {}

export abstract class SelectTool extends GestureTool {

  properties: SelectTool.Props

  constructor(attrs?: Partial<SelectTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "SelectTool"

    this.define({
      renderers: [ p.Any,   'auto' ],
      names:     [ p.Array, []     ],
    })
  }
}

SelectTool.initClass()
