import * as p from "core/properties"
import {PointGeometry} from "core/geometry"
import {ColumnDataSource} from "models/sources/column_data_source"
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

export abstract class EditToolView extends GestureToolView {
  model: EditTool

  _map_drag(sx: number[], sy: number[], renderer: GlyphRenderer): [number, number] | null {
    // Maps screen to data coordinates
    const frame = this.plot_model.frame;
    if (!frame.bbox.contains(sx, sy)) {
      return null;
    }
    const x = frame.xscales[renderer.x_range_name].invert(sx);
    const y = frame.yscales[renderer.y_range_name].invert(sy);
    return [x, y];
  }

  _delete_selected(renderer: GlyphRenderer): void {
    // Deletes all selected rows in the ColumnDataSource
    const cds = renderer.data_source;
    const indices = cds.selected['1d'].indices;
    for (const column of cds.columns()) {
      let values = cds.data[column];
      for (let index = 0; index < indices.length; index++) {
        const ind = indices[index];
        values.splice(ind-index, 1);
      }
    }
    cds.selected['1d'].indices = [];
    cds.change.emit(undefined);
    cds.properties.data.change.emit(undefined);
    cds.properties.selected.change.emit(undefined);
  }

  _pad_empty_columns(cds: ColumnDataSource, coord_columns: string[]): void {
    // Pad ColumnDataSource non-coordinate columns with empty_value
    for (const column of cds.columns()) {
      let values = cds.data[column];
      if (coord_columns.indexOf(column) === -1) {
        if ((values.push == null)) {
          cds.data[column] = (values = Array.prototype.slice.call(values));
        }
        values.push(this.model.empty_value);
      }
    }
  }

  _select_event(e: BkEv, append: boolean, renderers: GlyphRenderer[]): GlyphRenderer[] {
    // Process selection event on the supplied renderers and return selected renderers
    const frame = this.plot_model.frame;
    const {sx, sy} = e.bokeh;
    if (!frame.bbox.contains(sx, sy)) {
      return [];
    }
    const geometry: PointGeometry = {
      type: 'point',
      sx: sx,
      sy: sy,
    }
    const selected: GlyphRenderer[] = [];
    for (const renderer of renderers) {
      const sm = renderer.get_selection_manager();
      const cds = renderer.data_source;
      const views = [this.plot_view.renderer_views[renderer.id]];
      const did_hit = sm.select(views, geometry, true, append);
      if (did_hit) {
        selected.push(renderer)
      }
      cds.properties.selected.change.emit(undefined);
    }
    return selected;
  }
}

export abstract class EditTool extends GestureTool {
  empty_value: any
  renderers: GlyphRenderer[]
}

EditTool.prototype.type = "EditTool"

// EditTool.prototype.default_view = null

EditTool.define({
  empty_value: [ p.Any ],
  renderers:   [ p.Array, [] ]
})
