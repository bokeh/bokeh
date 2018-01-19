import {Dimensions} from "core/enums"
import * as p from "core/properties"
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


export class BoxDrawToolView extends EditToolView {
  model: BoxDrawTool
  _basepoint: [number, number] | null

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    this._select_event(e, append, this.model.renderers);
  }

  _keyup(e: BkEv): void {
    if ((e.keyCode === 8) && this.model.active) {
      for (const renderer of this.model.renderers) {
        this._delete_selected(renderer);
      }
    }
  }

  _pan_start(e: BkEv): void {
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
    this._pan(e, true, false);
  }

  _set_extent([sx0, sx1]: [number, number], [sy0, sy1]: [number, number],
              append: boolean, emit: boolean = false): void {
    const renderer = this.model.renderers[0];
    const frame = this.plot_model.frame;
    const glyph = renderer.glyph;
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
      ds.data[xkey].push(x)
      ds.data[ykey].push(y)
      ds.data[wkey].push(w)
      ds.data[hkey].push(h)
    } else {
      const index = ds.data[xkey].length-1;
      ds.data[xkey][index] = x;
      ds.data[ykey][index] = y;
      ds.data[wkey][index] = w;
      ds.data[hkey][index] = h;
    }
    this._pad_empty_columns(ds, [xkey, ykey, wkey, hkey])
    ds.change.emit(undefined);
    if (emit) {
      ds.properties.data.change.emit(undefined);
    }
  }

  _pan(e: BkEv, append: boolean = false, emit: boolean = false): void {
    const curpoint = [e.bokeh.sx, e.bokeh.sy];
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
  }
}


export class BoxDrawTool extends EditTool {
  dimensions: Dimensions

  tool_name = "Box Draw Tool"
  icon = "bk-tool-icon-box-draw"
  event_type = ["tap", "pan"]
  default_order = 30
}

BoxDrawTool.prototype.type = "BoxDrawTool"

BoxDrawTool.prototype.default_view = BoxDrawToolView

BoxDrawTool.define({
  dimensions: [ p.Dimensions, "both"],
})
