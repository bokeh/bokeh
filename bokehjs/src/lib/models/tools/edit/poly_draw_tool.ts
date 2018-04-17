import {Keys} from "core/dom"
import {UIEvent, GestureEvent, TapEvent, MoveEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {MultiLine} from "../../glyphs/multi_line"
import {Patches} from "../../glyphs/patches"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {EditTool, EditToolView} from "./edit_tool"

export interface HasPolyGlyph {
  glyph: MultiLine | Patches
}

export class PolyDrawToolView extends EditToolView {
  model: PolyDrawTool
  _drawing: boolean = false

  _tap(ev: TapEvent): void {
    if (this._drawing) {
      this._draw(ev, 'add');
      this.model.renderers[0].data_source.properties.data.change.emit();
    } else {
      const append = ev.shiftKey
      this._select_event(ev, append, this.model.renderers);
    }
  }

  _draw(ev: UIEvent, mode: string): void {
    const renderer = this.model.renderers[0];
    const point = this._map_drag(ev.sx, ev.sy, renderer);
    if (point == null) {
      return;
    }
    const [x, y] = point;
    const ds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (mode == 'new') {
      if (xkey) ds.get_array(xkey).push([x, x])
      if (ykey) ds.get_array(ykey).push([y, y])
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
        const xs = ds.get_array<number[]>(xkey)[xidx]
        const nx = xs[xs.length-1];
        xs[xs.length-1] = x;
        xs.push(nx);
      }
      if (ykey) {
        const yidx = ds.data[ykey].length-1;
        const ys = ds.get_array<number[]>(ykey)[yidx]
        const ny = ys[ys.length-1];
        ys[ys.length-1] = y;
        ys.push(ny);
      }
    }
    ds.change.emit()
  }

  _doubletap(ev: TapEvent): void {
    if (!this.model.active) { return; }
    if (this._drawing) {
      this._drawing = false;
      this._draw(ev, 'edit');
    } else {
      this._drawing = true;
      this._draw(ev, 'new');
    }
    this.model.renderers[0].data_source.properties.data.change.emit();
  }

  _move(ev: MoveEvent): void {
    if (this._drawing) {
      this._draw(ev, 'edit');
    }
  }

  _remove(): void {
    const renderer = this.model.renderers[0];
    const ds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (xkey) {
      const xidx = ds.data[xkey].length-1;
      const xs = ds.get_array<number[]>(xkey)[xidx]
      xs.splice(xs.length-1, 1)
    }
    if (ykey) {
      const yidx = ds.data[ykey].length-1;
      const ys = ds.get_array<number[]>(ykey)[yidx];
      ys.splice(ys.length-1, 1)
    }
    ds.change.emit()
    ds.properties.data.change.emit();
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (ev.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        if (this._drawing) {
          this._remove();
          this._drawing = false;
        }
        const cds = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  _pan_start(ev: GestureEvent): void {
    if (!this.model.drag) { return; }
    this._select_event(ev, true, this.model.renderers);
    this._basepoint = [ev.sx, ev.sy];
  }

  _pan(ev: GestureEvent): void {
    if (this._basepoint == null || !this.model.drag) { return; }
    const [bx, by] = this._basepoint;
    // Process polygon/line dragging
    for (const renderer of this.model.renderers) {
      const basepoint = this._map_drag(bx, by, renderer);
      const point = this._map_drag(ev.sx, ev.sy, renderer);
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
        if (xkey) xs = ds.data[xkey][index]
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
      ds.change.emit();
    }
    this._basepoint = [ev.sx, ev.sy];
  }

  _pan_end(ev: GestureEvent): void {
    if (!this.model.drag) { return; }
    this._pan(ev);
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected.indices = [];
      renderer.data_source.properties.data.change.emit();
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
    renderers: (GlyphRenderer & HasPolyGlyph)[]
  }

  export interface Props extends EditTool.Props {}

}

export interface PolyDrawTool extends PolyDrawTool.Attrs {}

export class PolyDrawTool extends EditTool {

  properties: PolyDrawTool.Props

  renderers: (GlyphRenderer & HasPolyGlyph)[]

  constructor(attrs?: Partial<PolyDrawTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PolyDrawTool"
    this.prototype.default_view = PolyDrawToolView

    this.define({
      drag: [ p.Bool, true ],
    })
  }

  tool_name = "Polygon Draw Tool"
  icon = "bk-tool-icon-poly-draw"
  event_type = ["pan" as "pan", "tap" as "tap", "move" as "move"]
  default_order = 3
}
PolyDrawTool.initClass()
