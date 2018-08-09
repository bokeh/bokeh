import {Keys} from "core/dom"
import {GestureEvent, TapEvent, KeyEvent, UIEvent, MoveEvent} from "core/ui_events"
import {Dimensions} from "core/enums"
import * as p from "core/properties"
import {Rect} from "../../glyphs/rect"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {ColumnDataSource} from "../../sources/column_data_source"
import {EditTool, EditToolView} from "./edit_tool"

export interface HasRectCDS {
  glyph: Rect
  data_source: ColumnDataSource
}

export class BoxEditToolView extends EditToolView {
  model: BoxEditTool
  _draw_basepoint: [number, number] | null

  _tap(ev: TapEvent): void {
    if ((this._draw_basepoint != null) || (this._basepoint != null)) { return; }
    const append = ev.shiftKey
    this._select_event(ev, append, this.model.renderers);
  }

  _keyup(ev: KeyEvent): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (ev.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (ev.keyCode == Keys.Esc) {
        // Type properly once selection_manager is typed
        const cds = renderer.data_source;
        cds.selection_manager.clear();
      }
    }
  }

  _set_extent([sx0, sx1]: [number, number], [sy0, sy1]: [number, number],
              append: boolean, emit: boolean = false): void {
    const renderer = this.model.renderers[0];
    const frame = this.plot_model.frame;
    // Type once dataspecs are typed
    const glyph: any = renderer.glyph;
    const cds = renderer.data_source;
    const xscale = frame.xscales[renderer.x_range_name];
    const yscale = frame.yscales[renderer.y_range_name];
    const [x0, x1] = xscale.r_invert(sx0, sx1);
    const [y0, y1] = yscale.r_invert(sy0, sy1);
    const [x, y] = [(x0+x1)/2., (y0+y1)/2.];
    const [w, h] = [x1-x0, y1-y0];
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    const [wkey, hkey] = [glyph.width.field, glyph.height.field];
    if (append) {
      this._pop_glyphs(cds, this.model.num_objects)
      if (xkey) cds.get_array(xkey).push(x)
      if (ykey) cds.get_array(ykey).push(y)
      if (wkey) cds.get_array(wkey).push(w)
      if (hkey) cds.get_array(hkey).push(h)
      this._pad_empty_columns(cds, [xkey, ykey, wkey, hkey])
    } else {
      const index = cds.data[xkey].length - 1
      if (xkey) cds.data[xkey][index] = x
      if (ykey) cds.data[ykey][index] = y
      if (wkey) cds.data[wkey][index] = w
      if (hkey) cds.data[hkey][index] = h
    }
    this._emit_cds_changes(cds, true, false, emit)
  }

  _update_box(ev: UIEvent, append: boolean = false, emit: boolean = false): void {
    if (this._draw_basepoint == null) { return; }
    const curpoint: [number, number] = [ev.sx, ev.sy];
    const frame = this.plot_model.frame;
    const dims = this.model.dimensions;
    const limits = this.model._get_dim_limits(this._draw_basepoint, curpoint, frame, dims);
    if (limits != null) {
      const [sxlim, sylim] = limits;
      this._set_extent(sxlim, sylim, append, emit);
    }
  }

  _doubletap(ev: TapEvent): void {
    if (!this.model.active) { return; }
    if (this._draw_basepoint != null) {
      this._update_box(ev, false, true)
      this._draw_basepoint = null;
    } else {
      this._draw_basepoint = [ev.sx, ev.sy];
      this._select_event(ev, true, this.model.renderers);
      this._update_box(ev, true, false);
    }
  }

  _move(ev: MoveEvent): void {
    this._update_box(ev, false, false);
  }

  _pan_start(ev: GestureEvent): void {
    if (ev.shiftKey) {
      if (this._draw_basepoint != null) { return }
      this._draw_basepoint = [ev.sx, ev.sy];
      this._update_box(ev, true, false);
    } else {
      if (this._basepoint != null) { return }
      this._select_event(ev, true, this.model.renderers);
      this._basepoint = [ev.sx, ev.sy];
    }
  }

  _pan(ev: GestureEvent, append: boolean = false, emit: boolean = false): void {
    if (ev.shiftKey) {
      if (this._draw_basepoint == null) { return; }
      this._update_box(ev, append, emit)
    } else {
      if (this._basepoint == null) { return; }
      this._drag_points(ev, this.model.renderers);
    }
  }

  _pan_end(ev: GestureEvent): void {
    this._pan(ev, false, true)
    if (ev.shiftKey) {
      this._draw_basepoint = null;
    } else {
      this._basepoint = null;
      for (const renderer of this.model.renderers)
        this._emit_cds_changes(renderer.data_source, false, true, true)
    }
  }
}

export namespace BoxEditTool {
  export interface Attrs extends EditTool.Attrs {
    dimensions: Dimensions
    num_objects: number
    renderers: (GlyphRenderer & HasRectCDS)[]
  }

  export interface Props extends EditTool.Props {}
}

export interface BoxEditTool extends BoxEditTool.Attrs {}

export class BoxEditTool extends EditTool {

  properties: BoxEditTool.Props

  renderers: (GlyphRenderer & HasRectCDS)[]

  constructor(attrs?: Partial<BoxEditTool.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "BoxEditTool"
    this.prototype.default_view = BoxEditToolView

    this.define({
      dimensions: [ p.Dimensions, "both" ],
      num_objects: [ p.Int, 0 ],
    })
  }

  tool_name = "Box Edit Tool"
  icon = "bk-tool-icon-box-edit"
  event_type = ["tap" as "tap", "pan" as "pan", "move" as "move"]
  default_order = 1
}
BoxEditTool.initClass()
