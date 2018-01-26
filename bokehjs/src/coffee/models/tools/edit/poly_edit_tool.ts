import {Keys} from "core/dom"
import * as p from "core/properties"
import {MultiLine} from "models/glyphs/multi_line"
import {Patches} from "models/glyphs/patches"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {EditTool, EditToolView, HasCDS, HasXYGlyph, BkEv} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export class PolyEditToolView extends EditToolView {
  model: PolyEditTool
  _selected_renderer: GlyphRenderer | null
  _basepoint: [number, number] | null

  _doubletap(e: BkEv): void {
    if (!this.model.active) { return; }
    // Perform hit testing
    const renderers = this._select_event(e, false, this.model.renderers);

    // If we did not hit an existing line, clear node CDS
    const vertex_renderer = this.model.vertex_renderer;
    const point_ds = vertex_renderer.data_source;
    // Type once dataspecs are typed
    const point_glyph: any = vertex_renderer.glyph;
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];
    if (!renderers.length) {
      if (pxkey) { point_ds.data[pxkey] = []; }
      if (pykey) { point_ds.data[pykey] = []; }
      this._selected_renderer = null;
      point_ds.change.emit(undefined);
      return;
    }

    // Otherwise copy selected line array to node CDS
    // (Note: can only edit one at a time)
    const renderer = renderers[0];
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const ds = renderer.data_source;
    const index = ds.selected['1d'].indices[0];
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (xkey) {
      let xs = ds.data[xkey][index];
      if ((xs.concat == null)) {
        ds.data[xkey][index] = (xs = Array.prototype.slice.call(xs));
      }
      if (pxkey) { point_ds.data[pxkey] = xs; }
    } else {
      point_glyph.x = {value: glyph.xs.value};
    }
    if (ykey) {
      let ys = ds.data[ykey][index];
      // Convert typed arrays to regular arrays for editing
      if ((ys.concat == null)) {
        ds.data[ykey][index] = (ys = Array.prototype.slice.call(ys));
      }
      if (pykey) { point_ds.data[pykey] = ys; }
    } else {
      point_glyph.y = {value: glyph.ys.value};
    }
    point_ds.selected['1d'].indices = [];
    this._selected_renderer = renderer;
    point_ds.change.emit(undefined);
    point_ds.properties.data.change.emit(undefined);
  }

  _tap(e: BkEv): void {
    const renderer = this.model.vertex_renderer;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }
    const ds = renderer.data_source;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const indices = ds.selected['1d'].indices.slice(0);
    this._select_event(e, append, [renderer]);
    this._select_event(e, append, this.model.renderers);
    /* Skip if a new vertex is selected by the tap or no vertex
       was selected before the tap */
    if (ds.selected['1d'].indices.length || indices.length !== 1  || this._selected_renderer == null) {
      return;
    }

    // Insert a new point after the selected vertex
    const [x, y] = point;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    const index = indices[0]+1;
    ds.selected['1d'].indices = [index];
    if (xkey) { ds.data[xkey].splice(index, 0, x); }
    if (ykey) { ds.data[ykey].splice(index, 0, y); }
    ds.change.emit(undefined);
    this._selected_renderer.data_source.properties.data.change.emit(undefined);
  }

  _pan_start(e: BkEv): void {
    this._select_event(e, true, [this.model.vertex_renderer]);
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan(e: BkEv): void {
    if (this._basepoint == null) { return; }
    this._drag_points(e, [this.model.vertex_renderer]);
    if (this._selected_renderer) {
      this._selected_renderer.data_source.change.emit(undefined);
    }
  }

  _pan_end(_e: BkEv): void {
    this.model.vertex_renderer.data_source.selected['1d'].indices = [];
    if (this._selected_renderer) {
      this._selected_renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
  }

  _keyup(e: BkEv): void {
    if (!this.model.active) { return; }
    let renderers;
    if (this._selected_renderer) {
      renderers = [this.model.vertex_renderer]
    } else {
      renderers = this.model.renderers
    }
    for (const renderer of renderers) {
      if (e.keyCode === Keys.Delete) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        const cds: any = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  deactivate(): void {
    const renderer = this.model.vertex_renderer;
    const ds = renderer.data_source;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) { ds.data[xkey] = []; }
    if (ykey) { ds.data[ykey] = []; }
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
    this._selected_renderer = null;
  }
}

export class PolyEditTool extends EditTool {
  renderers: (GlyphRenderer & HasCDS & HasPolyGlyph)[]
  vertex_renderer: (GlyphRenderer & HasCDS & HasXYGlyph)

  tool_name = "Poly Edit Tool"
  icon = "bk-tool-icon-poly-edit"
  event_type = ["tap", "pan"]
  default_order = 12
}

PolyEditTool.prototype.type = "PolyEditTool"

PolyEditTool.prototype.default_view = PolyEditToolView

PolyEditTool.define({
  drag: [ p.Bool, true ],
  vertex_renderer: [ p.Instance ],
})
