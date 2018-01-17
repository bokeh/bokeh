import {Dimensions} from "core/enums"
import * as p from "core/properties"
import {DrawTool, DrawToolView} from "./draw_tool"

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


export class BoxDrawToolView extends DrawToolView {
  model: BoxDrawTool
  _basepoint: [number, number] | null

  _pan_start(e: BkEv): void {
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _set_extent([sx0, sx1]: [number, number], [sy0, sy1]: [number, number],
              emit: boolean = false): void {
    const r = this.model.renderers[0];
    const glyph = r.glyph;
    let [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    [xkey, ykey] = [glyph.attributes[xkey].field, glyph.attributes[ykey].field];
    const ds = r.data_source;
    const frame = this.plot_model.frame;
    const xscale = frame.xscales[r.x_range_name];
    const yscale = frame.yscales[r.y_range_name];
    const [x0, x1] = xscale.r_invert(sx0, sx1);
    const [y0, y1] = yscale.r_invert(sy0, sy1);
    const new_data: {[key: string]: any[]} = {}
    new_data[xkey] = [[x0, x0, x1, x1]];
    new_data[ykey] = [[y1, y0, y0, y1]];
    ds.data = new_data;
    ds.change.emit(undefined);
    if (emit) {
      ds.properties.data.change.emit(undefined);
    }
  }

  _pan(e: BkEv): void {
    const curpoint = [e.bokeh.sx, e.bokeh.sy];
    const frame = this.plot_model.frame;
    const dims = this.model.dimensions;
    const limits = this.model._get_dim_limits(this._basepoint, curpoint, frame, dims);
    if (limits != null) {
      const [sxlim, sylim] = limits;
      this._set_extent(sxlim, sylim);
    }
  }

  _pan_end(e: BkEv): void {
    const curpoint = [e.bokeh.sx, e.bokeh.sy];
    const frame = this.plot_model.frame;
    const dims = this.model.dimensions;
    const limits = this.model._get_dim_limits(this._basepoint, curpoint, frame, dims);
    if (limits != null) {
      const [sxlim, sylim] = limits;
      this._set_extent(sxlim, sylim, true);
    }
    this._basepoint = null;
  }
}


export class BoxDrawTool extends DrawTool {
  dimensions: Dimensions

  tool_name = "Box Draw Tool"
  icon = "bk-tool-icon-box-draw"
  event_type = "pan"
  default_order = 30
}

BoxDrawTool.prototype.type = "BoxDrawTool"

BoxDrawTool.prototype.default_view = BoxDrawToolView

BoxDrawTool.define({
  dimensions: [ p.Dimensions, "both"],
})
