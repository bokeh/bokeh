import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as hittest from "core/hittest"

export class LineView extends XYGlyphView {

  _render(ctx, indices, {sx, sy}) {
    let drawing = false;
    this.visuals.line.set_value(ctx);
    let last_index = null;

    for (let i of indices) {
      if (drawing) {
        if (!isFinite(sx[i]+sy[i])) {
          ctx.stroke();
          ctx.beginPath();
          drawing = false;
          last_index = i;
          continue;
        }

        if ((last_index !== null) && ((i-last_index) > 1)) {
          ctx.stroke();
          drawing = false;
        }
      }

      if (drawing) {
        ctx.lineTo(sx[i], sy[i]);
      } else {
        ctx.beginPath();
        ctx.moveTo(sx[i], sy[i]);
        drawing = true;
      }

      last_index = i;
    }

    if (drawing) {
      return ctx.stroke();
    }
  }

  _hit_point(geometry) {
    /* Check if the point geometry hits this line glyph and return an object
    that describes the hit result:
      Args:
        * geometry (object): object with the following keys
          * sx (float): screen x coordinate of the point
          * sy (float): screen y coordinate of the point
          * type (str): type of geometry (in this case it's a point)
      Output:
        Object with the following keys:
          * 0d (bool): whether the point hits the glyph or not
          * 1d (array(int)): array with the indices hit by the point
    */
    const result = hittest.create_hit_test_result();
    const point = {x: geometry.sx, y: geometry.sy};
    let shortest = 9999;
    const threshold = Math.max(2, this.visuals.line.line_width.value() / 2);

    for (let i = 0, end = this.sx.length-1, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      const [p0, p1] = [{x: this.sx[i], y: this.sy[i]}, {x: this.sx[i+1], y: this.sy[i+1]}];
      const dist = hittest.dist_to_segment(point, p0, p1);

      if ((dist < threshold) && (dist < shortest)) {
        shortest = dist;
        result['0d'].glyph = this.model;
        result['0d'].get_view = (() => { return this; });
        result['0d'].flag = true;  // backward compat
        result['0d'].indices = [i];
      }
    }

    return result;
  }

  _hit_span(geometry) {
    let val, values;
    const {sx, sy} = geometry;
    const result = hittest.create_hit_test_result();

    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy);
      values = this._y;
    } else {
      val = this.renderer.xscale.invert(sx);
      values = this._x;
    }

    for (let i = 0, end = values.length-1, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if ((values[i]<=val && val<=values[i+1]) || (values[i+1]<=val && val<=values[i])) {
        result['0d'].glyph = this.model;
        result['0d'].get_view = (() => { return this; });
        result['0d'].flag = true;  // backward compat
        result['0d'].indices.push(i);
      }
    }

    return result;
  }

  get_interpolation_hit(i, geometry){
    let x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const [x2, y2, x3, y3] = [this._x[i], this._y[i], this._x[i+1], this._y[i+1]];

    if (geometry.type === 'point') {
      [y0, y1] = this.renderer.yscale.r_invert(sy-1, sy+1);
      [x0, x1] = this.renderer.xscale.r_invert(sx-1, sx+1);
    } else {
      if (geometry.direction === 'v') {
        [y0, y1] = this.renderer.yscale.r_invert(sy, sy);
        [x0, x1] = [x2, x3];
      } else {
        [x0, x1] = this.renderer.xscale.r_invert(sx, sx);
        [y0, y1] = [y2, y3];
      }
    }

    const res = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3);
    return [res.x, res.y];
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Line extends XYGlyph {
  static initClass() {
    this.prototype.default_view = LineView;

    this.prototype.type = 'Line';

    this.mixins(['line']);
  }
}
Line.initClass();
