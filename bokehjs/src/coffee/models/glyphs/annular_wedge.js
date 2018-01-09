/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as hittest from "core/hittest";
import * as p from "core/properties";
import {angle_between} from "core/util/math"
import {range} from "core/util/array"

export class AnnularWedgeView extends XYGlyphView {

  _map_data() {
    if (this.model.properties.inner_radius.units === "data") {
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this._inner_radius);
    } else {
      this.sinner_radius = this._inner_radius;
    }
    if (this.model.properties.outer_radius.units === "data") {
      this.souter_radius = this.sdist(this.renderer.xscale, this._x, this._outer_radius);
    } else {
      this.souter_radius = this._outer_radius;
    }
    this._angle = new Float32Array(this._start_angle.length);
    return range(0, this._start_angle.length).map((i) =>
      (this._angle[i] = this._end_angle[i] - this._start_angle[i]));
  }

  _render(ctx, indices, {sx, sy, _start_angle, _angle, sinner_radius, souter_radius}) {
    const direction = this.model.properties.direction.value();
    for (let i of Array.from(indices)) {
      if (isNaN(sx[i]+sy[i]+sinner_radius[i]+souter_radius[i]+_start_angle[i]+_angle[i])) {
        continue;
      }

      ctx.translate(sx[i], sy[i]);
      ctx.rotate(_start_angle[i]);

      ctx.moveTo(souter_radius[i], 0);
      ctx.beginPath();
      ctx.arc(0, 0, souter_radius[i], 0, _angle[i], direction);
      ctx.rotate(_angle[i]);
      ctx.lineTo(sinner_radius[i], 0);
      ctx.arc(0, 0, sinner_radius[i], 0, -_angle[i], !direction);
      ctx.closePath();

      ctx.rotate(-_angle[i]-_start_angle[i]);
      ctx.translate(-sx[i], -sy[i]);

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i);
        ctx.fill();
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  _hit_point(geometry) {
    let dist, sx0, sx1, sy0, sy1, x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    // check radius first
    if (this.model.properties.outer_radius.units === "data") {
      x0 = x - this.max_outer_radius;
      x1 = x + this.max_outer_radius;

      y0 = y - this.max_outer_radius;
      y1 = y + this.max_outer_radius;

    } else {
      sx0 = sx - this.max_outer_radius;
      sx1 = sx + this.max_outer_radius;
      [x0, x1] = Array.from(this.renderer.xscale.r_invert(sx0, sx1));

      sy0 = sy - this.max_outer_radius;
      sy1 = sy + this.max_outer_radius;
      [y0, y1] = Array.from(this.renderer.yscale.r_invert(sy0, sy1));
    }

    const candidates = [];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    for (var i of Array.from(this.index.indices(bbox))) {
      const or2 = Math.pow(this.souter_radius[i], 2);
      const ir2 = Math.pow(this.sinner_radius[i], 2);
      [sx0, sx1] = Array.from(this.renderer.xscale.r_compute(x, this._x[i]));
      [sy0, sy1] = Array.from(this.renderer.yscale.r_compute(y, this._y[i]));
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2);
      if ((dist <= or2) && (dist >= ir2)) {
        candidates.push([i, dist]);
      }
    }

    const direction = this.model.properties.direction.value();
    const hits = [];
    for ([i, dist] of Array.from(candidates)) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(sy-this.sy[i], sx-this.sx[i]);
      if (angle_between(-angle, -this._start_angle[i], -this._end_angle[i], direction)) {
        hits.push([i, dist]);
      }
    }

    return hittest.create_1d_hit_test_result(hits);
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_area_legend(ctx, x0, x1, y0, y1, index);
  }

  _scxy(i) {
    const r = (this.sinner_radius[i] + this.souter_radius[i])/2;
    const a = (this._start_angle[i]  + this._end_angle[i])   /2;
    return {x: this.sx[i] + (r*Math.cos(a)), y: this.sy[i] + (r*Math.sin(a))};
  }

  scx(i) { return this._scxy(i).x; }
  scy(i) { return this._scxy(i).y; }
}

export class AnnularWedge extends XYGlyph {
  static initClass() {
    this.prototype.default_view = AnnularWedgeView;

    this.prototype.type = 'AnnularWedge';

    this.mixins(['line', 'fill']);
    this.define({
        direction:    [ p.Direction,   'anticlock' ],
        inner_radius: [ p.DistanceSpec             ],
        outer_radius: [ p.DistanceSpec             ],
        start_angle:  [ p.AngleSpec                ],
        end_angle:    [ p.AngleSpec                ]
      });
  }
}
AnnularWedge.initClass();
