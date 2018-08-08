import {Keys} from "core/dom"
import {UIEvent, GestureEvent, TapEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {isArray} from "core/util/types"
import {EditTool, EditToolView} from "./edit_tool"

export class FreehandDrawToolView extends EditToolView {
  model: FreehandDrawTool

  _draw(ev: UIEvent, mode: string, emit: boolean = false): void {
    if (!this.model.active) { return; }

    const renderer = this.model.renderers[0];
    const point = this._map_drag(ev.sx, ev.sy, renderer);
    if (point == null) {
      return;
    }

    const [x, y] = point;
    const cds = renderer.data_source;
    const glyph: any = renderer.glyph;
    const [xkey, ykey] = [glyph.xs.field, glyph.ys.field];
    if (mode == 'new') {
      this._pop_glyphs(cds, this.model.num_objects)
      if (xkey) cds.get_array(xkey).push([x])
      if (ykey) cds.get_array(ykey).push([y])
      this._pad_empty_columns(cds, [xkey, ykey]);
    } else if (mode == 'add') {
      if (xkey) {
        const xidx = cds.data[xkey].length-1;
        let xs = cds.get_array<number[]>(xkey)[xidx]
        if (!isArray(xs)) {
          xs = Array.from(xs)
          cds.data[xkey][xidx] = xs;
        }
        xs.push(x);
      }
      if (ykey) {
        const yidx = cds.data[ykey].length-1;
        let ys = cds.get_array<number[]>(ykey)[yidx]
        if (!isArray(ys)) {
          ys = Array.from(ys)
          cds.data[ykey][yidx] = ys;
        }
        ys.push(y);
      }
    }
    this._emit_cds_changes(cds, true, true, emit)
  }

  _pan_start(ev: GestureEvent): void {
    this._draw(ev, 'new')
  }

  _pan(ev: GestureEvent): void {
    this._draw(ev, 'add')
  }

  _pan_end(ev: GestureEvent): void {
    this._draw(ev, 'add', true)
  }

  _tap(ev: TapEvent): void {
    this._select_event(ev, ev.shiftKey, this.model.renderers);
  }

 _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (ev.keyCode === Keys.Esc) {
        renderer.data_source.selection_manager.clear();
      } else if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      }
    }
  }
}

export namespace FreehandDrawTool {
  export interface Attrs extends EditTool.Attrs {
      num_objects: number
  }

  export interface Props extends EditTool.Props {}
}

export interface FreehandDrawTool extends FreehandDrawTool.Attrs {}

export class FreehandDrawTool extends EditTool {

  properties: FreehandDrawTool.Props

  constructor(attrs?: Partial<FreehandDrawTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "FreehandDrawTool"
    this.prototype.default_view = FreehandDrawToolView

    this.define({
      num_objects: [ p.Int, 0 ],
    })
  }
  tool_name = "Freehand Draw Tool"
  icon = "bk-tool-icon-freehand-draw"
  event_type = ["pan" as "pan", "tap" as "tap"]
  default_order = 3
}
FreehandDrawTool.initClass()
