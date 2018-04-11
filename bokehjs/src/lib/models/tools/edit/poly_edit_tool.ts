import {Keys} from "core/dom"
import {GestureEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
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
        point_ds.selected.indices = [];
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
      this._selected_renderer.data_source.change.emit();
      return;
    } else if (!renderers.length) {
      // If we did not hit an existing line, clear node CDS
      if (pxkey) point_ds.data[pxkey] = []
      if (pykey) point_ds.data[pykey] = []
      this._selected_renderer = null;
      this._drawing = false;
      point_ds.change.emit();
      return;
    }

    // Otherwise copy selected line array to vertex renderer CDS
    // (Note: can only edit one at a time)
    const renderer = renderers[0];
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const ds = renderer.data_source;
    const index = ds.selected.indices[0];
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (xkey) {
      const xs = ds.data[xkey][index]
      if (pxkey) point_ds.data[pxkey] = xs
    } else
      point_glyph.x = {value: glyph.xs.value};
    if (ykey) {
      const ys = ds.data[ykey][index]
      if (pykey) point_ds.data[pykey] = ys
    } else
      point_glyph.y = {value: glyph.ys.value};
    point_ds.selected.indices = [];
    this._selected_renderer = renderer;
    point_ds.change.emit();
    point_ds.properties.data.change.emit();
  }

  _move(ev: MoveEvent): void {
    if (this._drawing && this._selected_renderer != null) {
      const renderer = this.model.vertex_renderer;
      const point = this._map_drag(ev.sx, ev.sy, renderer);
      if (point == null) { return; }
      const [x, y] = point;
      const ds = renderer.data_source;
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = ds.selected.indices[0];
      if (xkey) ds.data[xkey][index] = x
      if (ykey) ds.data[ykey][index] = y
      ds.change.emit();
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
      const ds = renderer.data_source;
      // Type once dataspecs are typed
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.x.field, glyph.y.field];
      const index = ds.selected.indices[0];
      ds.selected.indices = [index+1];
      if (xkey) {
        const xs = ds.get_array(xkey)
        const nx = xs[index];
        xs[index] = x;
        xs.splice(index+1, 0, nx)
      }
      if (ykey) {
        const ys = ds.get_array(ykey);
        const ny = ys[index];
        ys[index] = y;
        ys.splice(index+1, 0, ny)
      }
      ds.change.emit();
      const selected_ds = this._selected_renderer.data_source;
      selected_ds.change.emit();
      selected_ds.properties.data.change.emit();
      return;
    }
    const append = ev.shiftKey
    this._select_event(ev, append, [renderer]);
    this._select_event(ev, append, this.model.renderers);
  }

  _remove_vertex(emit: boolean = true): void {
    if (!this._drawing || !this._selected_renderer) { return; }
    const renderer = this.model.vertex_renderer;
    const ds = renderer.data_source;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const index = ds.selected.indices[0];
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) ds.get_array(xkey).splice(index, 1)
    if (ykey) ds.get_array(ykey).splice(index, 1)
    if (emit) {
      ds.change.emit();
      ds.properties.data.change.emit();
    }
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

  _pan_end(_e: GestureEvent): void {
    this.model.vertex_renderer.data_source.selected.indices = [];
    if (this._selected_renderer) {
      this._selected_renderer.data_source.properties.data.change.emit();
    }
    this._basepoint = null;
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    let renderers;
    if (this._selected_renderer) {
      renderers = [this.model.vertex_renderer]
    } else {
      renderers = this.model.renderers
    }
    for (const renderer of renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (ev.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        if (this._drawing) {
          this._remove_vertex();
          this._drawing = false;
        }
        const cds = renderer.data_source;
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
    const ds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    if (xkey) ds.data[xkey] = []
    if (ykey) ds.data[ykey] = []
    ds.selection_manager.clear();
    ds.change.emit();
    this._selected_renderer.data_source.change.emit();
    ds.properties.data.change.emit();
    this._selected_renderer.data_source.properties.data.change.emit();
    this._selected_renderer = null;
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
