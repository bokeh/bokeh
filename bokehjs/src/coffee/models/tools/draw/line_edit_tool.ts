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

export class LineEditToolView extends DrawToolView {
  model: LineEditTool
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
    // Perform hit testing
    this._select_event(e, false, this.model.renderers);
    if (this._selected_renderers.length) {
      this._basepoint = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    } else {
      this._basepoint = null;
    }
  }

  _pan(e: BkEv): void {
    const point = this._map_drag(e.bokeh.sx, e.bokeh.sy);
    if (point == null || this._basepoint == null) {
      return;
    }
    for (const renderer of this._selected_renderers) {
      const ds = renderer.data_source;
      const glyph = renderer.glyph;
      const [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
      const [x, y] = point;
      const [px, py] = this._basepoint;
      const [dx, dy] = [x-px, y-py];
      const index = ds.selected['1d'].indices[0];
      const xs = ds.data[xkey][index];
      const ys = ds.data[ykey][index];
      for (let i = 0; i < ys.length; i++) {
        xs[i] = xs[i]+dx;
        ys[i] = ys[i]+dy;
      }
      ds.change.emit(undefined);
    }
    this._basepoint = point;
  }

  _pan_end(_e: BkEv): void {
    for (const renderer of this._selected_renderers) {
      renderer.data_source.selected['1d'].indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
    this._selected_renderers = [];
  }
}


export class LineEditTool extends DrawTool {
  tool_name = "Line Edit Tool"
  icon = "bk-tool-icon-line-edit"
  event_type = ["pan", "tap"]
  default_order = 12
}

LineEditTool.prototype.type = "LineEditTool"

LineEditTool.prototype.default_view = LineEditToolView
