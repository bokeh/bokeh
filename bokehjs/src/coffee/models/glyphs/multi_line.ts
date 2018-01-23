/* XXX: partial */
import {RBush} from "core/util/spatial";
import * as hittest from "core/hittest";
import {keys} from "core/util/object";
import {min, max} from "core/util/array";
import {isStrictNaN} from "core/util/types";
import {Glyph, GlyphView} from "./glyph"

export class MultiLineView extends GlyphView {

  _index_data() {
    const points = [];
    for (let i = 0, end = this._xs.length; i < end; i++) {
      if ((this._xs[i] === null) || (this._xs[i].length === 0)) {
        continue;
      }
      const xs = ((() => {
        const result = [];
        for (const x of this._xs[i]) {
          if (!isStrictNaN(x)) {
            result.push(x);
          }
        }
        return result;
      })());
      const ys = ((() => {
        const result1 = [];
        for (const y of this._ys[i]) {
          if (!isStrictNaN(y))
            result1.push(y);
        }
        return result1;
      })());
      points.push({
        minX: min(xs),
        minY: min(ys),
        maxX: max(xs),
        maxY: max(ys),
        i,
      });
    }

    return new RBush(points);
  }

  _render(ctx, indices, {sxs, sys}) {
    for (const i of indices) {
      const [sx, sy] = [sxs[i], sys[i]];

      this.visuals.line.set_vectorize(ctx, i);
      for (let j = 0, end = sx.length; j < end; j++) {
        if (j === 0) {
          ctx.beginPath();
          ctx.moveTo(sx[j], sy[j]);
          continue;
        } else if (isNaN(sx[j]) || isNaN(sy[j])) {
          ctx.stroke();
          ctx.beginPath();
          continue;
        } else {
          ctx.lineTo(sx[j], sy[j]);
        }
      }
      ctx.stroke();
    }
  }

  _hit_point(geometry) {
    const result = hittest.create_hit_test_result();
    const point = {x: geometry.sx, y: geometry.sy};
    let shortest = 9999;

    const hits = {};
    for (let i = 0, end = this.sxs.length; i < end; i++) {
      const threshold = Math.max(2, this.visuals.line.cache_select('line_width', i) / 2);
      let points = null;
      for (let j = 0, endj = this.sxs[i].length-1; j < endj; j++) {
        const [p0, p1] = [{x: this.sxs[i][j], y: this.sys[i][j]}, {x: this.sxs[i][j+1], y: this.sys[i][j+1]}];
        const dist = hittest.dist_to_segment(point, p0, p1);
        if ((dist < threshold) && (dist < shortest)) {
          shortest = dist;
          points = [j];
        }
      }
      if (points) {
        hits[i] = points;
      }
    }

    result['1d'].indices = keys(hits).map(parseInt)
    result['2d'].indices = hits;

    return result;
  }

  _hit_span(geometry) {
    let val, values;
    const {sx, sy} = geometry;
    const result = hittest.create_hit_test_result();

    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy);
      values = this._ys;
    } else {
      val = this.renderer.xscale.invert(sx);
      values = this._xs;
    }

    const hits = {};
    for (let i = 0, end = values.length; i < end; i++) {
      const points = [];
      for (let j = 0, endj = values[i].length-1; j < endj; j++) {
        if (values[i][j] <= val && val <= values[i][j+1]) {
          points.push(j);
        }
      }
      if (points.length > 0) {
        hits[i] = points;
      }
    }

    result['1d'].indices = keys(hits).map(parseInt)
    result['2d'].indices = hits;

    return result;
  }

  get_interpolation_hit(i, point_i, geometry){
    let x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const [x2, y2, x3, y3] = [this._xs[i][point_i], this._ys[i][point_i], this._xs[i][point_i+1], this._ys[i][point_i+1]];

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

export class MultiLine extends Glyph {
  static initClass() {
    this.prototype.default_view = MultiLineView;

    this.prototype.type = 'MultiLine';

    this.coords([['xs', 'ys']]);
    this.mixins(['line']);
  }
}
MultiLine.initClass();
