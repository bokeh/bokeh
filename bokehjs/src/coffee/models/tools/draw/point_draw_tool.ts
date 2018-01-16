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


export class PointDrawView extends EditToolView {
  model: PointDrawTool

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const did_hit = this._select_event(e, append);
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (did_hit || point == null) {
      return
    }

    // Convert typed arrays to regular arrays for manipulation
    const ds = this.model.source;
    let xs = ds.data[this.model.x];
    let ys = ds.data[this.model.y];
    if ((xs.concat == null)) {
      ds.data[this.model.x] = Array.prototype.slice.call(xs);
    }
    if ((ys.concat == null)) {
      ds.data[this.model.y] = Array.prototype.slice.call(ys);
    }

    // Pad columns other than those containing x and y values with NaNs
    for (let k in ds.data) {
      let v = ds.data[k];
      if (k !== this.model.x && k !== this.model.y) {
        if ((v.push == null)) {
          ds.data[k] = (v = Array.prototype.slice.call(v));
        }
        v.push(NaN);
      }
    }

    // Add x- and y-values into column arrays
    const [x, y] = point;
    xs.push(x);
    ys.push(y);

    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }

  _keyup(e: BkEv): void {
    if ((e.keyCode === 8) && this.model.active) {
      const ds = this.model.source;
      const indices = ds.selected['1d'].indices;
      indices.sort();
      for (let index = 0; index < indices.length; index++) {
        const ind = indices[index];
        ds.data[this.model.x].splice(ind-index, 1);
        ds.data[this.model.y].splice(ind-index, 1);
      }
      ds.selected['1d'].indices = [];
      ds.change.emit(undefined);
      ds.properties.data.change.emit(undefined);
      ds.properties.selected.change.emit(undefined);
    }
  }

  _pan_start(e: BkEv): void {
    // Perform hit testing
    this._select_event(e, false);
  }

  _pan(e: BkEv): void {
    const ds = this.model.source;
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (!ds.selected['1d'].indices.length || point == null) {
      return;
    }

    // If a Point is selected drag it
    const [x, y] = point;
    const index = ds.selected['1d'].indices[0];
    ds.data[this.model.x][index] = x;
    ds.data[this.model.y][index] = y;
    ds.change.emit(undefined);
    return ds.properties.data.change.emit(undefined);
  }

  _pan_end(e: BkEv): void {
    this.model.source.selected['1d'].indices = [];
  }
}


export class PointDrawTool extends SelectTool {
  source: ColumnDataSource
  x: string
  y: string

  tool_name = "Point Draw Tool"
  icon = "bk-tool-icon-point-draw"
  event_type = ["tap", "pan"]
  default_order = 12
}

PointDrawTool.prototype.type = "PointDrawTool"

PointDrawTool.prototype.default_view = PointDrawView

PointDrawTool.define({
  source: [ p.Instance ],
  x:      [ p.String, 'x' ],
  y:      [ p.String, 'y' ]
})
