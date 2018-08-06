import {Keys} from "core/dom"
import {GestureEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {isArray} from "core/util/types"
import {MultiLine} from "../../glyphs/multi_line"
import {Patches} from "../../glyphs/patches"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {EditTool, EditToolView, HasXYGlyph} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export class PolyEditToolView extends EditToolView {
  model: PolyEditTool
  _selected_renderer: GlyphRenderer | null
  _basepoint: [number, number] | null
  _drawing: boolean = false

  _doubletap(ev: TapEvent): void {
    if (!this.model.active) { return; }
    const point = this._map_drag(ev.sx, ev.sy, this.model.vertex_renderer);
    if (point == null) { return; }
    const [x, y] = point;

    // Perform hit testing
    const renderers = this._select_event(ev, false, this.model.renderers);
    const vertex_selected = this._select_event(ev, false, [this.model.vertex_renderer]);
    const point_ds = this.model.vertex_renderer.data_source;
    // Type once dataspecs are typed
    const point_glyph: any = this.model.vertex_renderer.glyph;
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];
    if (vertex_selected.length && this._selected_renderer != null) {
      // Insert a new point after the selected vertex and enter draw mode
      const index = point_ds.selected.indices[0];
      if (this._drawing) {
        point_ds.selection_manager.clear();
        if (pxkey) point_ds.data[pxkey][index] = x
        if (pykey) point_ds.data[pykey][index] = y
        this._drawing = false;
        this._selected_renderer.data_source.properties.data.change.emit();
      } else {
        point_ds.selected.indices = [index+1];
        if (pxkey) point_ds.get_array(pxkey).splice(index+1, 0, x)
        if (pykey) point_ds.get_array(pykey).splice(index+1, 0, y)
        this._drawing = true;
      }
      point_ds.change.emit();
      this._emit_cds_changes(this._selected_renderer.data_source, true, false, true)
      return;
    } else if (!renderers.length) {
      // If we did not hit an existing line, clear node CDS
      if (pxkey) point_ds.data[pxkey] = []
      if (pykey) point_ds.data[pykey] = []
      this._selected_renderer = null;
      this._drawing = false;
      point_ds.change.emit();
      return;
    } else {
      this._show_vertices(renderers[0])
    }
  }

  _show_vertices(renderer: GlyphRenderer): void {
    if (!this.model.active) { return; }

    // Copy selected line array to vertex renderer CDS
    const point_glyph: any = this.model.vertex_renderer.glyph;
    const point_ds = this.model.vertex_renderer.data_source;
    const [pxkey, pykey] = [point_glyph.x.field, point_glyph.y.field];

    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const cds = renderer.data_source;
    const index = cds.selected.indices[0];
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (xkey) {
      let xs = cds.data[xkey][index]
      if (!isArray(xs)) {
        xs = Array.from(xs)
        cds.data[xkey][index] = xs
      }
      if (pxkey) point_ds.data[pxkey] = xs
    } else
      point_glyph.x = {value: glyph.xs.value};
    if (ykey) {
      let ys = cds.data[ykey][index]
      if (!isArray(ys)) {
        ys = Array.from(ys)
        cds.data[ykey][index] = ys
      }
      if (pykey) point_ds.data[pykey] = ys
    } else
      point_glyph.y = {value: glyph.ys.value};
    this._selected_renderer = renderer;
    this._emit_cds_changes(this.model.vertex_renderer.data_source)
  }

  _clear_vertices(): void {
    const renderer = this.model.vertex_renderer;
    const cds = renderer.data_source;
    // Type once selection manager and dataspecs are typed
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) cds.data[xkey] = []
    if (ykey) cds.data[ykey] = []
    this._emit_cds_changes(cds)
    this._selected_renderer = null;
  }

  _move(ev: MoveEvent): void {
    if (this._drawing && this._selected_renderer != null) {
      const renderer = this.model.vertex_renderer;
      const point = this._map_drag(ev.sx, ev.sy, renderer);
      if (point == null) { return; }
      const [x, y] = point;
      const cds = renderer.data_source;
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = cds.selected.indices[0];
      if (xkey) cds.data[xkey][index] = x
      if (ykey) cds.data[ykey][index] = y
      cds.change.emit();
      this._selected_renderer.data_source.change.emit();
    }
  }

  _tap(ev: TapEvent): void {
    const renderer = this.model.vertex_renderer;
    const point = this._map_drag(ev.sx, ev.sy, renderer);
    if (point == null) {
      return;
    } else if (this._drawing && this._selected_renderer) {
      const [x, y] = point;
      const cds = renderer.data_source;
      // Type once dataspecs are typed
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = cds.selected.indices[0];
      cds.selected.indices = [index+1];
      if (xkey) {
        const xs = cds.get_array(xkey)
        const nx = xs[index];
        xs[index] = x;
        xs.splice(index+1, 0, nx)
      }
      if (ykey) {
        const ys = cds.get_array(ykey);
        const ny = ys[index];
        ys[index] = y;
        ys.splice(index+1, 0, ny)
      }
      cds.change.emit();
      this._emit_cds_changes(this._selected_renderer.data_source, true, false, true)
      return;
    }
    const append = ev.shiftKey
    this._select_event(ev, append, [renderer]);
    this._select_event(ev, append, this.model.renderers);
  }

  _remove_vertex(): void {
    if (!this._drawing || !this._selected_renderer) { return; }
    const renderer = this.model.vertex_renderer;
    const cds = renderer.data_source;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const index = cds.selected.indices[0];
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) cds.get_array(xkey).splice(index, 1)
    if (ykey) cds.get_array(ykey).splice(index, 1)
    cds.change.emit()
    this._emit_cds_changes(this._selected_renderer.data_source)
  }

  _pan_start(ev: GestureEvent): void {
    this._select_event(ev, true, [this.model.vertex_renderer]);
    this._basepoint = [ev.sx, ev.sy];
  }

  _pan(ev: GestureEvent): void {
    if (this._basepoint == null) { return; }
    this._drag_points(ev, [this.model.vertex_renderer]);
    if (this._selected_renderer) {
      this._selected_renderer.data_source.change.emit();
    }
  }

  _pan_end(ev: GestureEvent): void {
    if (this._basepoint == null) { return; }
    this._drag_points(ev, [this.model.vertex_renderer]);
    this._emit_cds_changes(this.model.vertex_renderer.data_source, false, true, true)
    if (this._selected_renderer) {
      this._emit_cds_changes(this._selected_renderer.data_source)
    }
    this._basepoint = null;
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    let renderers: GlyphRenderer[];
    if (this._selected_renderer) {
      renderers = [this.model.vertex_renderer]
    } else {
      renderers = this.model.renderers
    }
    for (const renderer of renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
        if (this._selected_renderer) {
          this._emit_cds_changes(this._selected_renderer.data_source)
        }
      } else if (ev.keyCode == Keys.Esc) {
        if (this._drawing) {
          this._remove_vertex();
          this._drawing = false;
        } else if (this._selected_renderer) {
          this._clear_vertices()
        }
        renderer.data_source.selection_manager.clear();
      }
    }
  }

  deactivate(): void {
    if (!this._selected_renderer) {
      return
    } else if (this._drawing) {
      this._remove_vertex();
      this._drawing = false;
    }
    this._clear_vertices()
  }
}

export namespace PolyEditTool {
  export interface Attrs extends EditTool.Attrs {
    vertex_renderer: (GlyphRenderer & HasXYGlyph)
    renderers: (GlyphRenderer & HasPolyGlyph)[]
  }

  export interface Props extends EditTool.Props {}
}

export interface PolyEditTool extends PolyEditTool.Attrs {}

export class PolyEditTool extends EditTool {

  properties: PolyEditTool.Props

  renderers: (GlyphRenderer & HasPolyGlyph)[]

  constructor(attrs?: Partial<PolyEditTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PolyEditTool"
    this.prototype.default_view = PolyEditToolView

    this.define({
      vertex_renderer: [ p.Instance ],
    })
  }

  tool_name = "Poly Edit Tool"
  icon = "bk-tool-icon-poly-edit"
  event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  default_order = 4
}
PolyEditTool.initClass()
