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
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan(e: BkEv): void {
    const [bx, by] = this._basepoint;
    for (const renderer of this.model.renderers) {
      const basepoint = this._map_drag(bx, by, renderer);
      const point = this._map_drag(e.bokeh.sx, e.bokeh.sy, renderer);
      if (point == null || basepoint == null) {
        continue;
      }

      const ds = renderer.data_source;
      const glyph = renderer.glyph;
      let [xkey, ykey] = Object.getPrototypeOf(glyph)._coords[0];
      [xkey, ykey] = [glyph.attributes[xkey].field, glyph.attributes[ykey].field];
      const [x, y] = point;
      const [px, py] = basepoint;
      const [dx, dy] = [x-px, y-py];
      for (const index of ds.selected['1d'].indices) {
        const xs = ds.data[xkey][index];
        const ys = ds.data[ykey][index];
        for (let i = 0; i < ys.length; i++) {
          xs[i] += dx;
          ys[i] += dy;
        }
      }
      ds.change.emit(undefined);
    }
    this._basepoint = [e.bokeh.sx, e.bokeh.sy];
  }

  _pan_end(_e: BkEv): void {
    for (const renderer of this.model.renderers) {
      renderer.data_source.selected['1d'].indices = [];
      renderer.data_source.properties.data.change.emit(undefined);
    }
    this._basepoint = null;
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
