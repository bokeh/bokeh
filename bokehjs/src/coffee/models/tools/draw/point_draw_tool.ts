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

export class PointDrawView extends DrawToolView {
  model: PointDrawTool
  _basepoint: [number, number] | null

  _tap(e: BkEv): void {
    const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
    const renderers = this._select_event(e, append, this.model.renderers);
    if (renderers.length || !this.model.add) {
      return
    }

    // Convert typed arrays to regular arrays for manipulation
    for (const renderer of this.model.renderers) {
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      if (point == null) {
	    continue;
      }
      const glyph = renderer.glyph
      const ds = renderer.data_source;
      const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
      let xs = ds.data[xkey];
      let ys = ds.data[ykey];
      if ((xs.concat == null)) {
        ds.data[xkey] = (xs = Array.prototype.slice.call(xs));
      }
      if ((ys.concat == null)) {
        ds.data[ykey] = (ys = Array.prototype.slice.call(ys));
      }
      // Pad columns other than those containing x and y values with NaNs
      for (let k in ds.data) {
        let v = ds.data[k];
        if (k !== xkey && k !== ykey) {
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
  }

  _keyup(e: BkEv): void {
    if ((e.keyCode === 8) && this.model.active) {
      for (const renderer of this.model.renderers) {
        this._delete_selected(renderer);
      }
    }
  }

  _pan_start(e: BkEv): void {
    // Perform hit testing
    if (this.model.drag) {
      const append = e.srcEvent.shiftKey != null ? e.srcEvent.shiftKey : false;
      this._select_event(e, append, this.model.renderers);
      this._basepoint = [e.bokeh.sx, e.bokeh.sy];
    }
  }

  _pan(e: BkEv): void {
    if (!this.model.drag) {
      return;
    }
    // If a Point is selected drag it
	const [bx, by] = this._basepoint;
    for (const renderer of this.model.renderers) {
      const basepoint = this._map_drag(bx, by, renderer);
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      if (point == null || basepoint == null) {
        continue;
      }

      const [x, y] = point;
      const [px, py] = basepoint;
      const [dx, dy] = [x-px, y-py];
      const glyph = renderer.glyph;
      const ds = renderer.data_source;
      const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
      for (const index of ds.selected['1d'].indices) {
        ds.data[xkey][index] += dx;
        ds.data[ykey][index] += dy;
      }
      ds.change.emit(undefined);
      ds.properties.data.change.emit(undefined);
    }
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan_end(_e: BkEv): void {
    if (!this.model.drag) { return; }
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected['1d'].indices = [];
    }
    this._basepoint = null;
  }
}


export class PointDrawTool extends DrawTool {
  add: boolean
  drag: boolean

  tool_name = "Point Draw Tool"
  icon = "bk-tool-icon-point-draw"
  event_type = ["tap", "pan"]
  default_order = 12
}

PointDrawTool.prototype.type = "PointDrawTool"

PointDrawTool.prototype.default_view = PointDrawView

PointDrawTool.define({
  add:  [ p.Bool, true ],
  drag: [ p.Bool, true ]
})
