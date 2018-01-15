import {Dimensions} from "core/enums"
import * as p from "core/properties"
import {ColumnDataSource} from "models/sources/column_data_source"
import {SelectTool} from "../gestures/select_tool"
import {EditToolView} from "./edit_tool"


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
  _basepoint: number[]

  _pan_start(e: BkEv) {
    const {sx, sy} = e.bokeh;
    this._basepoint = [sx, sy];
  }

  _set_extent(...args: any[]) {
    const [sx0, sx1] = args[0],
      [sy0, sy1] = args[1],
      val = args[2],
      emit = val != null ? val : false;
    const r = this.computed_renderers[0];
    const ds = this.model.source;
    const { frame } = this.plot_model;
    const xscale = frame.xscales[r.x_range_name];
    const yscale = frame.yscales[r.y_range_name];
    const [x0, x1] = xscale.r_invert(sx0, sx1);
    const [y0, y1] = yscale.r_invert(sy0, sy1);
    const new_data = {};
    new_data[this.model.x] = [[x0, x0, x1, x1]];
    new_data[this.model.y] = [[y1, y0, y0, y1]];
    ds.data = new_data;
    ds.change.emit(undefined);
    if (emit) {
      ds.properties.data.change.emit(undefined);
    }
  }

  _pan(e: BkEv) {
    const {sx, sy} = e.bokeh;
    const curpoint = [sx, sy];
    const { frame } = this.plot_model;
    const dims = this.model.dimensions;
    const [sxlim, sylim] = this.model._get_dim_limits(this._basepoint, curpoint, frame, dims);
    this._set_extent(sxlim, sylim);
  }

  _pan_end(e: BkEv) {
    let emit;
    const {sx, sy} = e.bokeh;
    const curpoint = [sx, sy];
    const { frame } = this.plot_model;
    const dims = this.model.dimensions;

    const [sxlim, sylim] = this.model._get_dim_limits(this._basepoint, curpoint, frame, dims);
    this._set_extent(sxlim, sylim, (emit=true));
    this._basepoint = null;
  }
}


export class BoxDrawTool extends SelectTool {
  dimensions: Dimensions
  source: ColumnDataSource
  x: string
  y: string

  tool_name = "Box Draw Tool"
  icon = "bk-tool-icon-box-draw"
  event_type = "pan"
  default_order = 30
}

BoxDrawTool.prototype.type = "BoxDrawTool"

BoxDrawTool.prototype.default_view = BoxDrawToolView

BoxDrawTool.define({
  source: [ p.Instance ],
  dimensions: [ p.Dimensions, "both"],
  x: [ p.String, 'x' ],
  y: [ p.String, 'y' ]
})
