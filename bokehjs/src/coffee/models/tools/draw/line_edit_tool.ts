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

  _pan_start(e: BkEv) {
    // Perform hit testing
    this._select_event(e, false);
    const [x, y] = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    [this._px, this._py] = [x, y];
  }

  _pan(e: BkEv) {
    const ds = this.model.source;
    if (!ds.selected['1d'].indices.length) {
      return;
    }
    const [x, y] = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    const [dx, dy] = [x-this._px, y-this._py];
    [this._px, this._py] = [x, y];
    const index = ds.selected['1d'].indices[0];
    const xs = ds.data[this.model.x][index];
    const ys = ds.data[this.model.y][index];
	for (let i = 0; i < ys.length; i++) {
      xs[i] = xs[i]+dx;
      ys[i] = ys[i]+dy;
    }
    ds.change.emit(undefined);
  }

  _pan_end(e: BkEv) {
    this._px = null;
    this._py = null;
    const ds = this.model.source;
    ds.selected['1d'].indices = [];
    this.plot_view.push_state('line_edit', {selection: this.plot_view.get_selection()});
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