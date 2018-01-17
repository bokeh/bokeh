import * as p from "core/properties"
import {PointGeometry} from "core/geometry"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {GestureTool, GestureToolView} from "../gestures/gesture_tool"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
  keyCode: number
  timeStamp: number
}

export abstract class DrawToolView extends GestureToolView {
  model: DrawTool
  _selected_renderers: GlyphRenderer[]

  // this is executed when the pan/drag event starts
  _map_drag(sx: number[], sy: number[]): [number, number] | null {
    const frame = this.plot_model.frame;
    if (!frame.bbox.contains(sx, sy)) {
      return null;
    }
    const x = frame.xscales['default'].invert(sx);
    const y = frame.yscales['default'].invert(sy);
    return [x, y];
  }

  _delete_selected(renderer: GlyphRenderer): void {
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    const indices = ds.selected['1d'].indices;
    indices.sort();
    const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    for (let index = 0; index < indices.length; index++) {
      const ind = indices[index];
      ds.data[xkey].splice(ind-index, 1);
      ds.data[ykey].splice(ind-index, 1);
    }
    ds.selected['1d'].indices = [];
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
    ds.properties.selected.change.emit(undefined);
  }

  _select_event(e: BkEv, append: boolean, renderers: GlyphRenderer[]): void {
    const {sx, sy} = e.bokeh;
    const geometry: PointGeometry = {
      type: 'point',
      sx: sx,
      sy: sy,
    }
    this._selected_renderers = [];
    for (const renderer of renderers) {
      const sm = renderer.get_selection_manager();
      const views = [this.plot_view.renderer_views[renderer.id]];
      const did_hit = sm.select(views, geometry, true, append);
      if (did_hit) {
        this._selected_renderers.push(renderer)
      }
    }
  }
}

export abstract class DrawTool extends GestureTool {
  renderers: GlyphRenderer[]
}

DrawTool.prototype.type = "DrawTool"

// DrawTool.prototype.default_view = null

DrawTool.define({
  renderers: [ p.Array, [] ]
})
