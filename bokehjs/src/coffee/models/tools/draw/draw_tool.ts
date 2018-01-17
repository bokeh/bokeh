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

  // this is executed when the pan/drag event starts
  _map_drag(sx: number[], sy: number[], renderer: GlyphRenderer): [number, number] | null {
    const frame = this.plot_model.frame;
    if (!frame.bbox.contains(sx, sy)) {
      return null;
    }
    const x = frame.xscales[renderer.x_range_name].invert(sx);
    const y = frame.yscales[renderer.y_range_name].invert(sy);
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

  _select_event(e: BkEv, append: boolean, renderers: GlyphRenderer[]): GlyphRenderer[] {
    const frame = this.plot_model.frame;
    if (!frame.bbox.contains(sx, sy)) {
      return [];
    }
    const {sx, sy} = e.bokeh;
    const geometry: PointGeometry = {
      type: 'point',
      sx: sx,
      sy: sy,
    }
    const selected: GlyphRenderer[] = [];
    for (const renderer of renderers) {
      const sm = renderer.get_selection_manager();
      const views = [this.plot_view.renderer_views[renderer.id]];
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      const did_hit = sm.select(views, geometry, true, append);
      if (did_hit) {
        selected.push(renderer)
      }
    }
    return selected;
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
