import {Keys} from "core/dom"
import * as p from "core/properties"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {EditTool, EditToolView, HasCDS, HasXYGlyph, BkEv} from "./edit_tool"


export class PointDrawToolView extends EditToolView {
  model: PointDrawTool

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const renderers = this._select_event(e, append, this.model.renderers);
    if (renderers.length || !this.model.add) {
      return
    }

    const renderer = this.model.renderers[0];
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph
    const ds = renderer.data_source;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    const [x, y] = point;

    if (xkey) {
      let xs = ds.data[xkey];
      if ((xs.push == null)) {
        ds.data[xkey] = (xs = Array.prototype.slice.call(xs));
      }
      xs.push(x);
    }
    if (ykey) {
      let ys = ds.data[ykey];
      if ((ys.push == null)) {
        ds.data[ykey] = (ys = Array.prototype.slice.call(ys));
      }
      ys.push(y);
    }
    this._pad_empty_columns(ds, [xkey, ykey]);

    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }

  _keyup(e: BkEv): void {
    if (!this.model.active) { return; }
    for (const renderer of this.model.renderers) {
      if (e.keyCode === Keys.Delete) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        const cds: any = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  _pan_start(e: BkEv): void {
    if (this.model.drag) {
      this._select_event(e, true, this.model.renderers);
      this._basepoint = [e.bokeh.sx, e.bokeh.sy];
    }
  }

  _pan(e: BkEv): void {
    if (!this.model.drag || this._basepoint == null) {
      return;
    }
    this._drag_points(e, this.model.renderers);
  }

  _pan_end(e: BkEv): void {
    this._pan(e);
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected['1d'].indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
  }
}


export class PointDrawTool extends EditTool {
  add: boolean
  drag: boolean
  renderers: (GlyphRenderer & HasCDS & HasXYGlyph)[]

  tool_name = "Point Draw Tool"
  icon = "bk-tool-icon-point-draw"
  event_type = ["tap", "pan"]
  default_order = 12
}

PointDrawTool.prototype.type = "PointDrawTool"

PointDrawTool.prototype.default_view = PointDrawToolView

PointDrawTool.define({
  add:  [ p.Bool, true ],
  drag: [ p.Bool, true ],
})
