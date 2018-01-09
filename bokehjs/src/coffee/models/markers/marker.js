/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {XYGlyph, XYGlyphView} from "../glyphs/xy_glyph";
import * as hittest from "core/hittest";
import * as p from "core/properties"
import {range} from "core/util/array"

export class MarkerView extends XYGlyphView {

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    // using objects like this seems a little wonky, since the keys are coerced to
    // stings, but it works
    const indices = [index];
    const sx = { };
    sx[index] = (x0+x1)/2;
    const sy = { };
    sy[index] = (y0+y1)/2;
    const size = { };
    size[index] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.4;
    const angle = { };
    angle[index] = this._angle[index];

    const data = {sx, sy, _size: size, _angle: angle};
    return this._render(ctx, indices, data);
  }

  _render(ctx, indices, {sx, sy, _size, _angle}) {
    for (let i of indices) {
      if (isNaN(sx[i]+sy[i]+_size[i]+_angle[i])) {
        continue;
      }

      const r = _size[i]/2;

      ctx.beginPath();
      ctx.translate(sx[i], sy[i]);

      if (_angle[i]) {
        ctx.rotate(_angle[i]);
      }

      this._render_one(ctx, i, sx[i], sy[i], r, this.visuals.line, this.visuals.fill);

      if (_angle[i]) {
        ctx.rotate(-_angle[i]);
      }

      ctx.translate(-sx[i], -sy[i]);
    }
  }

  _mask_data(all_indices) {
    // dilate the inner screen region by max_size and map back to data space for use in
    // spatial query
    const hr = this.renderer.plot_view.frame.bbox.h_range;
    const sx0 = hr.start - this.max_size;
    const sx1 = hr.end + this.max_size;
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);

    const vr = this.renderer.plot_view.frame.bbox.v_range;
    const sy0 = vr.start - this.max_size;
    const sy1 = vr.end + this.max_size;
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    return this.index.indices(bbox);
  }

  _hit_point(geometry) {
    const {sx, sy} = geometry;

    const sx0 = sx - this.max_size;
    const sx1 = sx + this.max_size;
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);

    const sy0 = sy - this.max_size;
    const sy1 = sy + this.max_size;
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const candidates = this.index.indices(bbox);

    const hits = [];
    for (let i of candidates) {
      const s2 = this._size[i]/2;
      const dist = Math.abs(this.sx[i]-sx) + Math.abs(this.sy[i]-sy);
      if ((Math.abs(this.sx[i]-sx) <= s2) && (Math.abs(this.sy[i]-sy) <= s2)) {
        hits.push([i, dist]);
      }
    }
    return hittest.create_1d_hit_test_result(hits);
  }

  _hit_span(geometry) {
    let ms, x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const {minX, minY, maxX, maxY} = this.bounds();
    const result = hittest.create_hit_test_result();

    if (geometry.direction === 'h') {
      y0 = minY;
      y1 = maxY;
      ms = this.max_size/2;
      const sx0 = sx - ms;
      const sx1 = sx + ms;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
    } else {
      x0 = minX;
      x1 = maxX;
      ms = this.max_size/2;
      const sy0 = sy - ms;
      const sy1 = sy + ms;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    }

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const hits = this.index.indices(bbox);

    result['1d'].indices = hits;
    return result;
  }

  _hit_rect(geometry) {
    const {sx0, sx1, sy0, sy1} = geometry;
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const result = hittest.create_hit_test_result();
    result['1d'].indices = this.index.indices(bbox);
    return result;
  }

  _hit_poly(geometry) {
    const {sx, sy} = geometry;

    // TODO (bev) use spatial index to pare candidate list
    const candidates = range(0, this.sx.length);

    const hits = [];
    for (let i = 0, end = candidates.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      const idx = candidates[i];
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sx, sy)) {
        hits.push(idx);
      }
    }
    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }
}

export class Marker extends XYGlyph {
  static initClass() {

    this.mixins(['line', 'fill']);
    this.define({
      size:  [ p.DistanceSpec, { units: "screen", value: 4 } ],
      angle: [ p.AngleSpec,    0                             ]
    });
  }
}
Marker.initClass();
