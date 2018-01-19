import {Keys} from "core/dom"
import {MultiLine} from "models/glyphs/multi_line"
import {Patches} from "models/glyphs/patches"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {EditTool, EditToolView} from "./edit_tool"

export interface HasPolyCDS {
  data_source: ColumnDataSource
  glyph: MultiLine | Patches
}

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
  keyCode: number
  shiftKey: boolean
}

export class PolyDrawToolView extends EditToolView {
  model: PolyDrawTool

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, append, this.model.renderers);
  }

  _keyup(e: BkEv): void {
    if (!this.model.active) { return; }
    for (const renderer of this.model.renderers) {
      if (e.keyCode === Keys.Delete) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        renderer.data_source.selection_manager.clear();
      }
    }
  }

  _pan_start(e: BkEv): void {
    const renderer = this.model.renderers[0];
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }
    const [x, y] = point;
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    const indices = ds.selected['1d'].indices;
    let count;
    if (indices.length) {
      count = indices[0];
    } else {
      count = ds.data[xkey].length-1;
    }
    if (append && (count >= 0)) {
      ds.data[xkey][count].push(x);
      ds.data[ykey][count].push(y);
    } else {
      ds.data[xkey].push([x, x]);
      ds.data[ykey].push([y, y]);
      this._pad_empty_columns(ds, [xkey, ykey]);
    }
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }

  _pan(e: BkEv): void {
    const renderer = this.model.renderers[0];
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }

    const [x, y] = point;
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    const indices = ds.selected['1d'].indices;
    let count;
    if (indices.length>0) {
      count = indices[0];
    } else {
      count = ds.data[xkey].length-1;
    }
    const xs = ds.data[xkey][count];
    const ys = ds.data[ykey][count];
    xs[xs.length-1] = x;
    ys[ys.length-1] = y;
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }
}


export class PolyDrawTool extends EditTool {
  renderers: GlyphRenderer[] & Array<HasPolyCDS>

  tool_name = "Polygon Draw Tool"
  icon = "bk-tool-icon-polygon-draw"
  event_type = ["pan", "tap"]
  default_order = 12
}

PolyDrawTool.prototype.type = "PolyDrawTool"

PolyDrawTool.prototype.default_view = PolyDrawToolView
