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

export class LineEditToolView extends EditToolView {
  model: LineEditTool
  _basepoint: [number, number]

  _pan_start(e: BkEv): void {
    // Perform hit testing
    this._select_event(e, false);
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (point == null) {
      return
    }
    this._basepoint = point;
  }

  _pan(e: BkEv): void {
    const ds = this.model.source;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy)
    if (!ds.selected['1d'].indices.length || point == null || this._basepoint == null) {
      return;
    }
    const [x, y] = point
	const [px, py] = this._basepoint
    const [dx, dy] = [x-px, y-py];
    this._basepoint = point;
    const index = ds.selected['1d'].indices[0];
    const xs = ds.data[this.model.x][index];
    const ys = ds.data[this.model.y][index];
    for (let i = 0; i < ys.length; i++) {
      xs[i] = xs[i]+dx;
      ys[i] = ys[i]+dy;
    }
    ds.change.emit(undefined);
  }

  _pan_end(_e: BkEv): void {
    this.model.source.selected['1d'].indices = [];
    this._basepoint = null;
  }
}


export class LineEditTool extends SelectTool {
  source: ColumnDataSource
  x: string
  y: string

  tool_name = "Line Edit Tool"
  icon = "bk-tool-icon-line-edit"
  event_type = ["pan", "tap"]
  default_order = 12
}

LineEditTool.prototype.type = "LineEditTool"

LineEditTool.prototype.default_view = LineEditToolView

LineEditTool.define({
  source: [ p.Instance ],
  x: [ p.String, 'x' ],
  y: [ p.String, 'y' ]
})
