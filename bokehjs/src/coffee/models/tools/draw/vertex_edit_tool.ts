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


export class VertexEditToolView extends EditToolView {
  model: VertexEditTool

  _doubletap(e: BkEv) {
    // Perform hit testing
    let did_hit, renderer;
    const geometry = {
      type: 'point',
      sx: e.bokeh.sx,
      sy: e.bokeh.sy
    };
    const renderers_by_source = this._computed_renderers_by_data_source();
    for (let _ in renderers_by_source) {
      const renderers = renderers_by_source[_];
      const sm = this.model.source.selection_manager;
      const r_views = (Array.from(renderers).map((r) => this.plot_view.renderer_views[r.id]));
      did_hit = sm.select(r_views, geometry, true, false);
      if (did_hit) {
        renderer = renderers[0];
      }
    }

    // If we did not hit an existing line, clear node CDS
    if (!did_hit) {
      if (this.model.timestamp !== e.timeStamp) {
        this.model.source.data[this.model.x] = [];
        this.model.source.data[this.model.y] = [];
        this.model.source.change.emit(undefined);
      }
      return;
    }

    this.model.timestamp = e.timeStamp;

    // Otherwise copy selected curve arrays to node CDS
    const index = renderer.data_source.selected['1d'].indices[0];
    let xs = renderer.data_source.data[this.model.x][index];
    let ys = renderer.data_source.data[this.model.y][index];
    if ((xs.concat == null)) {
      xs = Array.prototype.slice.call(xs);
      renderer.data_source.data[this.model.x][index] = xs;
    }
    if ((ys.concat == null)) {
      ys = Array.prototype.slice.call(ys);
      renderer.data_source.data[this.model.y][index] = ys;
    }
    this.model.source.selected['1d'].indices = [];
    this.model.source.data[this.model.x] = xs;
    this.model.source.data[this.model.y] = ys;
    this.model.source.change.emit(undefined);
    this.model.active = true;
    this.model.line_source = renderer.data_source;
  }

  _tap(e: BkEv) {
    const indices = this.model.source.selected['1d'].indices.slice(0);
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const did_hit = this._select_event(e, append);
    if (did_hit) {
      return;
    }

    const ds = this.model.source;
    const [x, y] = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (indices.length === 1) {
      const index = indices[0]+1;
      ds.selected['1d'].indices = [index];
      ds.data[this.model.x].splice(index, 0, x);
      ds.data[this.model.y].splice(index, 0, y);
      ds.change.emit(undefined);
      this.model.line_source.properties.data.change.emit(undefined);
    }
  }

  _pan_start(e: BkEv) {
    // Perform hit testing
    this._select_event(e, false);
  }

  _pan(e: BkEv) {
    const ds = this.model.source;
    if (!ds.selected['1d'].indices.length) {
      return;
    }

    // If a Point is selected drag it
    const [x, y] = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    const index = ds.selected['1d'].indices[0];
    ds.data[this.model.x][index] = x;
    ds.data[this.model.y][index] = y;
    ds.change.emit(undefined);
    this.model.line_source.change.emit(undefined);
  }

  _pan_end(e: BkEv) {
    this.model.source.selected['1d'].indices = [];
    this.model.line_source.properties.data.change.emit(undefined);
  }

  _keyup(e: BkEv) {
    if ((e.keyCode === 8) && this.model.active) {
      const ds = this.model.source;
      const { indices } = ds.selected['1d'];
      indices.sort((a: number, b: number) => a-b);
      for (let index = 0; index < indices.length; index++) {
        const ind = indices[index];
        ds.data[this.model.x].splice(ind-index, 1);
        ds.data[this.model.y].splice(ind-index, 1);
      }
      ds.selected['1d'].indices = [];
      ds.change.emit(undefined);
      this.model.line_source.change.emit(undefined);
      this.model.line_source.properties.data.change.emit(undefined);
    }
  }
}

export class VertexEditTool extends SelectTool {
  line_source: ColumnDataSource
  source: ColumnDataSource
  x: string
  y: string

  tool_name = "Vertex Edit Tool"
  icon = "bk-tool-icon-vertex-edit"
  event_type = ["tap", "pan"]
  default_order = 12
}

VertexEditTool.prototype.type = "VertexEditTool"

VertexEditTool.prototype.default_view = VertexEditToolView

VertexEditTool.define({
  source: [ p.Instance ],
  x:      [ p.String, 'x' ],
  y:      [ p.String, 'y' ]
})
