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

export class PolyDrawToolView extends DrawToolView {
  model: PolyDrawTool

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
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (point == null) {
      return;
    }
    const [x, y] = point;
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const renderer = this.model.renderers[0];
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    const indices = ds.selected['1d'].indices;
    let count;
    if (indices.length) {
      count = indices[0];
    } else {
      count = ds.data[xkey].length-1;
    }
    if (append && (count >= 0)) {
      ds.data[xkey][count].push(x);
      ds.data[ykey][count].push(y);
    } else {
      ds.data[xkey].push([x, x]);
      ds.data[ykey].push([y, y]);
    }
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }

  _pan(e: BkEv): void {
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (point == null) {
      return;
    }
    const [x, y] = point;

    const renderer = this.model.renderers[0];
    const ds = renderer.data_source;
    const glyph = renderer.glyph;
    const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
    const indices = ds.selected['1d'].indices;
    let count;
    if (indices.length>0) {
      count = indices[0];
    } else {
      count = ds.data[xkey].length-1;
    }
    const xs = ds.data[xkey][count];
    const ys = ds.data[ykey][count];
    xs[xs.length-1] = x;
    ys[ys.length-1] = y;
    ds.change.emit(undefined);
    ds.properties.data.change.emit(undefined);
  }
}


export class PolyDrawTool extends DrawTool {
  tool_name = "Polygon Draw Tool"
  icon = "bk-tool-icon-polygon-draw"
  event_type = ["pan", "tap"]
  default_order = 12
}

PolyDrawTool.prototype.type = "PolyDrawTool"

PolyDrawTool.prototype.default_view = PolyDrawToolView
