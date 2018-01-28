import {Keys} from "core/dom"
import * as p from "core/properties"
import {copy} from "core/util/array"
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
  _drawing: boolean = false

  _doubletap(e: BkEv): void {
    if (!this.model.active) { return; }
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, this.model.vertex_renderer);
    if (point == null) { return; }
    const [x, y] = point;

    // Perform hit testing
    const renderers = this._select_event(e, false, this.model.renderers);
    const vertex_selected = this._select_event(e, false, [this.model.vertex_renderer]);
    const point_ds = this.model.vertex_renderer.data_source;
    // Type once dataspecs are typed
    const point_glyph: any = this.model.vertex_renderer.glyph;
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];
    if (vertex_selected.length && this._selected_renderer != null) {
      // Insert a new point after the selected vertex and enter draw mode
      const index = point_ds.selected['1d'].indices[0];
      if (this._drawing) {
        point_ds.selected['1d'].indices = [];
        if (pxkey) { point_ds.data[pxkey][index] = x; }
        if (pykey) { point_ds.data[pykey][index] = y; }
        this._drawing = false;
        this._selected_renderer.data_source.properties.data.change.emit(undefined);
      } else {
        point_ds.selected['1d'].indices = [index+1];
        if (pxkey) { point_ds.data[pxkey].splice(index+1, 0, x); }
        if (pykey) { point_ds.data[pykey].splice(index+1, 0, y); }
        this._drawing = true;
      }
      point_ds.change.emit(undefined);
      this._selected_renderer.data_source.change.emit(undefined);
      return;
    } else if (!renderers.length) {
      // If we did not hit an existing line, clear node CDS
      if (pxkey) { point_ds.data[pxkey] = []; }
      if (pykey) { point_ds.data[pykey] = []; }
      this._selected_renderer = null;
      this._drawing = false;
      point_ds.change.emit(undefined);
      return;
    }

    // Otherwise copy selected line array to vertex renderer CDS
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
        // Convert typed arrays to regular arrays for editing
        ds.data[xkey][index] = (xs = copy(xs));
      }
      if (pxkey) { point_ds.data[pxkey] = xs; }
    } else {
      point_glyph.x = {value: glyph.xs.value};
    }
    if (ykey) {
      let ys = ds.data[ykey][index];
      // Convert typed arrays to regular arrays for editing
      if ((ys.concat == null)) {
        ds.data[ykey][index] = (ys = copy(ys));
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

  _move(e: BkEv): void {
    if (this._drawing && this._selected_renderer != null) {
      const renderer = this.model.vertex_renderer;
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      if (point == null) { return; }
      const [x, y] = point;
      const ds = renderer.data_source;
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = ds.selected['1d'].indices[0];
      if (xkey) { ds.data[xkey][index] = x; }
      if (ykey) { ds.data[ykey][index] = y; }
      ds.change.emit(undefined);
      this._selected_renderer.data_source.change.emit(undefined);
    }
  }

  _tap(e: BkEv): void {
    const renderer = this.model.vertex_renderer;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    } else if (this._drawing && this._selected_renderer) {
      const [x, y] = point;
      const ds = renderer.data_source;
      // Type once dataspecs are typed
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = ds.selected['1d'].indices[0];
      ds.selected['1d'].indices = [index+1];
      if (xkey) {
        const xs = ds.data[xkey];
        const nx = xs[index];
        xs[index] = x;
        xs.splice(index+1, 0, nx)
      }
      if (ykey) {
        const ys = ds.data[ykey];
        const ny = ys[index];
        ys[index] = y;
        ys.splice(index+1, 0, ny)
      }
      ds.change.emit(undefined);
      this._selected_renderer.data_source.change.emit(undefined);
      return;
    }
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, append, [renderer]);
    this._select_event(e, append, this.model.renderers);
  }

  _remove_vertex(emit: boolean = true): void {
    if (!this._drawing || !this._selected_renderer) { return; }
    const renderer = this.model.vertex_renderer;
    const ds = renderer.data_source;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const index = ds.selected['1d'].indices[0];
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) { ds.data[xkey].splice(index, 1); }
    if (ykey) { ds.data[ykey].splice(index, 1); }
    if (emit) {
      ds.change.emit(undefined);
      ds.properties.data.change.emit(undefined);
    }
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
    if (!this.model.active || !this._mouse_in_frame) { return; }
    let renderers;
    if (this._selected_renderer) {
      renderers = [this.model.vertex_renderer]
    } else {
      renderers = this.model.renderers
    }
    for (const renderer of renderers) {
      if (e.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        if (this._drawing) {
          this._remove_vertex();
          this._drawing = false;
        }
        const cds: any = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  deactivate(): void {
    if (!this._selected_renderer) {
      return
    } else if (this._drawing) {
      this._remove_vertex(false);
      this._drawing = false;
    }
    const renderer = this.model.vertex_renderer;
    // Type once selection manager and dataspecs are typed
    const ds: any = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) { ds.data[xkey] = []; }
    if (ykey) { ds.data[ykey] = []; }
    ds.selection_manager.clear();
    ds.change.emit(undefined);
    this._selected_renderer.data_source.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
    this._selected_renderer.data_source.properties.data.change.emit(undefined);
    this._selected_renderer = null;
  }
}

export namespace PolyEditTool {
  export interface Attrs extends EditTool.Attrs {
    vertex_renderer: (GlyphRenderer & HasCDS & HasXYGlyph)
    renderers: (GlyphRenderer & HasCDS & HasPolyGlyph)[]
  }

  export interface Opts extends EditTool.Opts {}
}

export interface PolyEditTool extends PolyEditTool.Attrs {}

export class PolyEditTool extends EditTool {

  renderers: (GlyphRenderer & HasCDS & HasPolyGlyph)[]

  static initClass() {
    this.prototype.type = "PolyEditTool"
    this.prototype.default_view = PolyEditToolView

    this.define({
      vertex_renderer: [ p.Instance ],
    })
  }

  tool_name = "Poly Edit Tool"
  icon = "bk-tool-icon-poly-edit"
  event_type = ["tap", "pan", "move"]
  default_order = 12
}
PolyEditTool.initClass()
