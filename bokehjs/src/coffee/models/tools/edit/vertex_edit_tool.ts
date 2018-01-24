import * as p from "core/properties"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {EditTool, EditToolView} from "./edit_tool"

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

export class VertexEditToolView extends EditToolView {
  model: VertexEditTool
  _selected_renderer: GlyphRenderer | null
  _basepoint: [number, number] | null

  _doubletap(e: BkEv): void {
    // Perform hit testing
    const renderers = this._select_event(e, false, this.model.renderers);

    // If we did not hit an existing line, clear node CDS
    const vertex_renderer = this.model.vertex_renderer;
    const point_ds = vertex_renderer.data_source;
    const point_glyph = vertex_renderer.glyph;
    let [pxkey, pykey] = Object.getPrototypeOf(point_glyph)._coords[0];
    [pxkey, pykey] = [point_glyph.attributes[pxkey].field, point_glyph.attributes[pykey].field];
    if (!renderers.length) {
      point_ds.data[pxkey] = [];
      point_ds.data[pykey] = [];
      this._selected_renderer = null;
      point_ds.change.emit(undefined);
      return;
    }

    // Otherwise copy selected line array to node CDS
    // (Note: can only edit one at a time)
    const renderer = renderers[0];
    const glyph = renderer.glyph;
    const ds = renderer.data_source;
    const index = ds.selected['1d'].indices[0];
    let [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    [xkey, ykey] = [glyph.attributes[xkey].field, glyph.attributes[ykey].field];
    let xs = ds.data[xkey][index];
    let ys = ds.data[ykey][index];

    // Convert typed arrays to regular arrays for editing
    if ((xs.concat == null)) {
      xs = Array.prototype.slice.call(xs);
      ds.data[xkey][index] = xs;
    }
    if ((ys.concat == null)) {
      ys = Array.prototype.slice.call(ys);
      ds.data[ykey][index] = ys;
    }
    point_ds.selected['1d'].indices = [];
    point_ds.data[pxkey] = xs;
    point_ds.data[pykey] = ys;
    point_ds.change.emit(undefined);
    this.model.active = true;
    this._selected_renderer = renderer;
  }

  _tap(e: BkEv): void {
    const renderer = this.model.vertex_renderer;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }
    const ds = renderer.data_source;
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const indices = ds.selected['1d'].indices.slice(0);
    this._select_event(e, append, [renderer]);
    this._select_event(e, append, this.model.renderers);
    if (ds.selected['1d'].indices.length) {
      return;
    }

    const [x, y] = point;
    let [xkey, ykey] = Object.getPrototypeOf(renderer.glyph)._coords[0];
    [xkey, ykey] = [renderer.glyph.attributes[xkey].field, renderer.glyph.attributes[ykey].field];
    if (indices.length === 1) {
      const index = indices[0]+1;
      ds.selected['1d'].indices = [index];
      ds.data[xkey].splice(index, 0, x);
      ds.data[ykey].splice(index, 0, y);
      ds.change.emit(undefined);
      this._selected_renderer.data_source.properties.data.change.emit(undefined);
    }
  }

  _pan_start(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, append, [this.model.vertex_renderer]);
    this._select_event(e, false, this.model.renderers);
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan(e: BkEv): void {
    const [bx, by] = this._basepoint;
    if (this._selected_renderer == null) {
      for (const renderer of this.model.renderers) {
        const basepoint = this._map_drag(bx, by, renderer);
        const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
        if (point == null || basepoint == null) {
          continue;
        }

        const ds = renderer.data_source;
        const glyph = renderer.glyph;
        let [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
        [xkey, ykey] = [glyph.attributes[xkey].field, glyph.attributes[ykey].field];
        const [x, y] = point;
        const [px, py] = basepoint;
        const [dx, dy] = [x-px, y-py];
        for (const index of ds.selected['1d'].indices) {
          const xs = ds.data[xkey][index];
          const ys = ds.data[ykey][index];
          for (let i = 0; i < ys.length; i++) {
            xs[i] += dx;
            ys[i] += dy;
          }
        }
        ds.change.emit(undefined);
      }
      this._basepoint = [e.bokeh.sx, e.bokeh.sy];
	  return;
	}

    const vertex_renderer = this.model.vertex_renderer;
    const ds = vertex_renderer.data_source;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, vertex_renderer);
    const basepoint = this._map_drag(bx, by, vertex_renderer);
    if (!ds.selected['1d'].indices.length || point == null || basepoint == null) {
      return;
    }

    // If a Point is selected drag it
    const glyph = vertex_renderer.glyph;
    const [x, y] = point;
    const [px, py] = basepoint;
    const [dx, dy] = [x-px, y-py];
    let [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    [xkey, ykey] = [glyph.attributes[xkey].field, glyph.attributes[ykey].field];
    for (const index of ds.selected['1d'].indices) {
      ds.data[xkey][index] += dx;
      ds.data[ykey][index] += dy;
    }
    ds.change.emit(undefined);
    this._selected_renderer.data_source.change.emit(undefined);
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan_end(_e: BkEv): void {
    this.model.vertex_renderer.data_source.selected['1d'].indices = [];
    if (this._selected_renderer) {
      this._selected_renderer.data_source.properties.data.change.emit(undefined);
    } else {
	  for (const renderer of this.model.renderers) {
        renderer.data_source.selected['1d'].indices = [];
        renderer.data_source.properties.data.change.emit(undefined);
      }
	}
    this._basepoint = null;
  }

  _keyup(e: BkEv): void {
    if ((e.keyCode === 8) && this.model.active) {
      if (this._selected_renderer) {
        this._delete_selected(this.model.vertex_renderer);
      } else {
        for (const renderer of this.model.renderers) {
          this._delete_selected(renderer);
        }
      }
    }
  }

  deactivate(): void {
    const renderer = this.model.vertex_renderer;
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    let [pxkey, pykey] = Object.getPrototypeOf(glyph)._coords[0];
    [pxkey, pykey] = [glyph.attributes[pxkey].field, glyph.attributes[pykey].field];
    ds.data[pxkey] = [];
    ds.data[pykey] = [];
    this._selected_renderer = null;
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }
}

export class VertexEditTool extends EditTool {
  vertex_renderer: GlyphRenderer
  drag: boolean

  tool_name = "Vertex Edit Tool"
  icon = "bk-tool-icon-vertex-edit"
  event_type = ["tap", "pan"]
  default_order = 12
}

VertexEditTool.prototype.type = "VertexEditTool"

VertexEditTool.prototype.default_view = VertexEditToolView

VertexEditTool.define({
  drag: [ p.Bool ],
  vertex_renderer: [ p.Instance ],
})
