import {Keys} from "core/dom"
import * as p from "core/properties"
import {copy} from "core/util/array"
import {MultiLine} from "models/glyphs/multi_line"
import {Patches} from "models/glyphs/patches"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {EditTool, EditToolView, HasCDS, BkEv} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export class PolyDrawToolView extends EditToolView {
  model: PolyDrawTool
  _drawing: boolean = false

  _tap(e: BkEv): void {
    if (this._drawing) {
      this._draw(e, 'add');
      this.model.renderers[0].data_source.properties.data.change.emit(undefined);
    } else {
      const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
      this._select_event(e, append, this.model.renderers);
    }
  }

  _draw(e: BkEv, mode: string): void {
    const renderer = this.model.renderers[0];
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
    if (point == null) {
      return;
    }
    const [x, y] = point;
    const ds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (mode == 'new') {
      if (xkey) { ds.data[xkey].push([x, x]); }
      if (ykey) { ds.data[ykey].push([y, y]); }
      this._pad_empty_columns(ds, [xkey, ykey]);
    } else if (mode == 'edit') {
      if (xkey) {
        const xs = ds.data[xkey][ds.data[xkey].length-1];
        xs[xs.length-1] = x;
      }
      if (ykey) {
        const ys = ds.data[ykey][ds.data[ykey].length-1];
        ys[ys.length-1] = y;
      }
    } else if (mode == 'add') {
      if (xkey) {
        const xidx = ds.data[xkey].length-1;
        let xs = ds.data[xkey][xidx];
        if (xs.push == null) {
          ds.data[xkey][xidx] = (xs = copy(xs));
        }
        const nx = xs[xs.length-1];
        xs[xs.length-1] = x;
        xs.push(nx);
      }
      if (ykey) {
        const yidx = ds.data[ykey].length-1;
        let ys = ds.data[ykey][yidx];
        if (ys.push == null) {
          ds.data[ykey][yidx] = (ys = copy(ys));
        }
        const ny = ys[ys.length-1];
        ys[ys.length-1] = y;
        ys.push(ny);
      }
    }
    ds.change.emit(undefined)
  }

  _doubletap(e: BkEv): void {
    if (!this.model.active) { return; }
    if (this._drawing) {
      this._drawing = false;
      this._draw(e, 'edit');
    } else {
      this._drawing = true;
      this._draw(e, 'new');
    }
    this.model.renderers[0].data_source.properties.data.change.emit(undefined);
  }

  _move(e: BkEv): void {
    if (this._drawing) {
      this._draw(e, 'edit');
    }
  }

  _remove(): void {
    const renderer = this.model.renderers[0];
    const ds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (xkey) {
      const xidx = ds.data[xkey].length-1;
      let xs = ds.data[xkey][xidx];
      if (xs.splice == null) {
          ds.data[xkey][xidx] = (xs = copy(xs));
      }
      xs.splice(xs.length-1, 1);
    }
    if (ykey) {
      const yidx = ds.data[ykey].length-1;
      let ys = ds.data[ykey][yidx];
      if (ys.push == null) {
          ds.data[ykey][yidx] = (ys = copy(ys));
        }

      ys.splice(ys.length-1, 1);
    }
    ds.change.emit(undefined)
    ds.properties.data.change.emit(undefined);
  }

  _keyup(e: BkEv): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (e.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        if (this._drawing) {
          this._remove();
          this._drawing = false;
        }
        const cds: any = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  _pan_start(e: BkEv): void {
    if (!this.model.drag) { return; }
    this._select_event(e, true, this.model.renderers);
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan(e: BkEv): void {
    if (this._basepoint == null || !this.model.drag) { return; }
    const [bx, by] = this._basepoint;
    // Process polygon/line dragging
    for (const renderer of this.model.renderers) {
      const basepoint = this._map_drag(bx, by, renderer);
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      if (point == null || basepoint == null) {
        continue;
      }

      const ds = renderer.data_source;
      // Type once dataspecs are typed
      const glyph: any = renderer.glyph;
      const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
      if (!xkey && !ykey) { continue; }
      const [x, y] = point;
      const [px, py] = basepoint;
      const [dx, dy] = [x-px, y-py];
      for (const index of ds.selected.indices) {
        let length, xs, ys;
        if (xkey) { xs = ds.data[xkey][index]; }
        if (ykey) {
          ys = ds.data[ykey][index];
          length = ys.length;
        } else {
          length = xs.length;
        }
        for (let i = 0; i < length; i++) {
          if (xs) { xs[i] += dx; }
          if (ys) { ys[i] += dy; }
        }
      }
      ds.change.emit(undefined);
    }
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan_end(e: BkEv): void {
    if (!this.model.drag) { return; }
    this._pan(e);
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected.indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
  }

  deactivate(): void {
    if (this._drawing) {
      this._remove();
      this._drawing = false;
    }
  }

}

export namespace PolyDrawTool {
  export interface Attrs extends EditTool.Attrs {
    drag: boolean
    renderers: (GlyphRenderer & HasCDS & HasPolyGlyph)[]
  }

  export interface Opts extends EditTool.Opts {}
}

export interface PolyDrawTool extends PolyDrawTool.Attrs {}

export class PolyDrawTool extends EditTool {

  renderers: (GlyphRenderer & HasCDS & HasPolyGlyph)[]

  constructor(attrs?: Partial<PolyDrawTool.Attrs>, opts?: PolyDrawTool.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "PolyDrawTool"
    this.prototype.default_view = PolyDrawToolView

    this.define({
      drag: [ p.Bool, true ],
    })
  }

  tool_name = "Polygon Draw Tool"
  icon = "bk-tool-icon-poly-draw"
  event_type = ["pan", "tap", "move"]
  default_order = 3
}
PolyDrawTool.initClass()
