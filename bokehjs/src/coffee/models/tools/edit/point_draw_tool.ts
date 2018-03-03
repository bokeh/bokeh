import {Keys} from "core/dom"
import {GestureEvent, TapEvent, KeyEvent} from "core/ui_events"
import * as p from "core/properties"
import {copy} from "core/util/array"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {EditTool, EditToolView, HasCDS, HasXYGlyph} from "./edit_tool"

export class PointDrawToolView extends EditToolView {
  model: PointDrawTool

  _tap(ev: TapEvent): void {
    const append = ev.shiftKey
    const renderers = this._select_event(ev, append, this.model.renderers);
    if (renderers.length || !this.model.add) {
      return
    }

    const renderer = this.model.renderers[0];
    const point = this._map_drag(ev.sx, ev.sy, renderer);
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
        ds.data[xkey] = (xs = copy(xs));
      }
      xs.push(x);
    }
    if (ykey) {
      let ys = ds.data[ykey];
      if ((ys.push == null)) {
        ds.data[ykey] = (ys = copy(ys));
      }
      ys.push(y);
    }
    this._pad_empty_columns(ds, [xkey, ykey]);

    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (ev.keyCode == Keys.Esc) {
        // Type once selection_manager is typed
        const cds: any = renderer.data_source;
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
    if (!this.model.drag || this._basepoint == null) {
      return;
    }
    this._drag_points(ev, this.model.renderers);
  }

  _pan_end(ev: GestureEvent): void {
    if (!this.model.drag) { return; }
    this._pan(ev);
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected.indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
  }
}

export namespace PointDrawTool {
  export interface Attrs extends EditTool.Attrs {
    add: boolean
    drag: boolean
    renderers: (GlyphRenderer & HasCDS & HasXYGlyph)[]
  }
}

export interface PointDrawTool extends PointDrawTool.Attrs {}

export class PointDrawTool extends EditTool {

  renderers: (GlyphRenderer & HasCDS & HasXYGlyph)[]

  constructor(attrs?: Partial<PointDrawTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "PointDrawTool"
    this.prototype.default_view = PointDrawToolView

    this.define({
      add:  [ p.Bool, true ],
      drag: [ p.Bool, true ],
    })
  }

  tool_name = "Point Draw Tool"
  icon = "bk-tool-icon-point-draw"
  event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  default_order = 2
}
PointDrawTool.initClass()
