import {GestureTool, GestureToolView} from "./gesture_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {GraphRenderer} from "../../renderers/graph_renderer"
import * as p from "core/properties"
import {extend} from "core/util/object"
import {includes} from "core/util/array"
import {SelectionGeometry} from "core/bokeh_events"
import {Geometry} from "core/geometry"

export type DataRenderer = GlyphRenderer | GraphRenderer

export interface BkEv {
  keyCode: number
}

export abstract class SelectToolView extends GestureToolView {

  model: SelectTool

  get computed_renderers(): DataRenderer[] {
    let renderers = this.model.renderers
    const names = this.model.names

    if (renderers.length == 0) {
      const all_renderers = this.plot_model.plot.renderers
      renderers = all_renderers.filter((r): r is DataRenderer => {
        return r instanceof GlyphRenderer || r instanceof GraphRenderer
      })
    }

    if (names.length > 0)
      renderers = renderers.filter((r) => includes(names, r.name))

    return renderers
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

  _keyup(e: BkEv): void {
    if (e.keyCode == 27) {
      for (const r of this.computed_renderers) {
        // XXX: needs typings for renderers
        const ds = (r as any).data_source
        const sm = ds.selection_manager
        sm.clear()
      }
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
        g = extend({}, geometry, {x, y})
        break
      }
      case 'rect': {
        const {sx0, sx1, sy0, sy1} = geometry
        const [x0, x1] = xm.r_invert(sx0, sx1)
        const [y0, y1] = ym.r_invert(sy0, sy1)
        g = extend({}, geometry, {x0, y0, x1, y1})
        break
      }
      case 'poly': {
        const {sx, sy} = geometry
        const x = xm.v_invert(sx)
        const y = ym.v_invert(sy)
        g = extend({}, geometry, {x, y})
        break
      }
      default:
        throw new Error(`Unrecognized selection geometry type: '${geometry.type}'`)
    }

    this.plot_model.plot.trigger_event(new SelectionGeometry({geometry: g, final: final}))
  }
}

export abstract class SelectTool extends GestureTool {
  renderers: DataRenderer[]
  names: string[]
}

SelectTool.prototype.type = "SelectTool"

// SelectTool.prototype.default_view = null

SelectTool.define({
  renderers: [ p.Array, [] ],
  names:     [ p.Array, [] ],
})
