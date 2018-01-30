import {Keys} from "core/dom"
import {Dimensions} from "core/enums"
import {copy} from "core/util/array"
import * as p from "core/properties"
import {Rect} from "models/glyphs/rect"
import {GlyphRenderer} from "models/renderers/glyph_renderer"
import {ColumnDataSource} from "models/sources/column_data_source"
import {EditTool, EditToolView, BkEv} from "./edit_tool"

export interface HasRectCDS {
  glyph: Rect
  data_source: ColumnDataSource
}

export class BoxEditToolView extends EditToolView {
  model: BoxEditTool

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, append, this.model.renderers);
  }

  _keyup(e: BkEv): void {
    if (!this.model.active || !this._mouse_in_frame) { return; }
    for (const renderer of this.model.renderers) {
      if (e.keyCode === Keys.Backspace) {
        this._delete_selected(renderer);
      } else if (e.keyCode == Keys.Esc) {
        // Type properly once selection_manager is typed
        const cds: any = renderer.data_source;
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
    const ds = renderer.data_source;
    const xscale = frame.xscales[renderer.x_range_name];
    const yscale = frame.yscales[renderer.y_range_name];
    const [x0, x1] = xscale.r_invert(sx0, sx1);
    const [y0, y1] = yscale.r_invert(sy0, sy1);
    const [x, y] = [(x0+x1)/2., (y0+y1)/2.];
    const [w, h] = [x1-x0, y1-y0];
    const [xkey, ykey] = [glyph.x.field, glyph.y.field];
    const [wkey, hkey] = [glyph.width.field, glyph.height.field];
    if (append) {
      if (xkey) {
        let xs = ds.data[xkey];
        if (xs.push == null) {
          ds.data[xkey] = (xs = copy(xs));
        }
        xs.push(x)
      }
      if (ykey) {
        let ys = ds.data[ykey];
        if (ys.push == null) {
          ds.data[ykey] = (ys = copy(ys));
        }
        ys.push(y)
      }
      if (wkey) {
        let ws = ds.data[wkey];
        if (ws.push == null) {
          ds.data[wkey] = (ws = copy(ws));
        }
        ws.push(w)
      }
      if (hkey) {
        let hs = ds.data[hkey];
        if (hs.push == null) {
          ds.data[hkey] = (hs = copy(hs));
        }
        hs.push(h)
      }
      this._pad_empty_columns(ds, [xkey, ykey, wkey, hkey])
    } else {
      const index = ds.data[xkey].length-1;
      if (xkey) { ds.data[xkey][index] = x; }
      if (ykey) { ds.data[ykey][index] = y; }
      if (wkey) { ds.data[wkey][index] = w; }
      if (hkey) { ds.data[hkey][index] = h; }
    }
    ds.change.emit(undefined);
    if (emit) {
      ds.properties.data.change.emit(undefined);
    }
  }

  _pan_start(e: BkEv): void {
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
    const shift = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, true, this.model.renderers);
    if (shift) {
      this._pan(e, true, false);
    }
  }

  _pan(e: BkEv, append: boolean = false, emit: boolean = false): void {
    if (this._basepoint == null) { return; }
    const curpoint: [number, number] = [e.bokeh.sx, e.bokeh.sy];

    // Attempt to drag selected rects
    const shift = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    if (!shift) {
      this._drag_points(e, this.model.renderers);
      return;
    }

    const frame = this.plot_model.frame;
    const dims = this.model.dimensions;
    const limits = this.model._get_dim_limits(this._basepoint, curpoint, frame, dims);
    if (limits != null) {
      const [sxlim, sylim] = limits;
      this._set_extent(sxlim, sylim, append, emit);
    }
  }

  _pan_end(e: BkEv): void {
    this._pan(e, false, true)
    this._basepoint = null;
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected.indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
  }
}

export namespace BoxEditTool {
  export interface Attrs extends EditTool.Attrs {
    dimensions: Dimensions
    renderers: (GlyphRenderer & HasRectCDS)[]
  }

  export interface Opts extends EditTool.Opts {}
}

export interface BoxEditTool extends BoxEditTool.Attrs {}

export class BoxEditTool extends EditTool {

  renderers: (GlyphRenderer & HasRectCDS)[]

  constructor(attrs?: Partial<BoxEditTool.Attrs>, opts?: BoxEditTool.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "BoxEditTool"
    this.prototype.default_view = BoxEditToolView

    this.define({
      dimensions: [ p.Dimensions, "both" ],
    })
  }

  tool_name = "Box Draw Tool"
  icon = "bk-tool-icon-box-edit"
  event_type = ["tap", "pan", "move"]
  default_order = 30
}
BoxEditTool.initClass()
