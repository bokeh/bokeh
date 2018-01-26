/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {Direction} from "core/enums"
import * as hittest from "core/hittest";
import * as p from "core/properties";
import {angle_between} from "core/util/math"

export class WedgeView extends XYGlyphView {
  model: Wedge

  _map_data() {
    if (this.model.properties.radius.units === "data") {
      return this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius);
    } else {
      return this.sradius = this._radius;
    }
  }

  _render(ctx, indices, {sx, sy, sradius, _start_angle, _end_angle}) {
    const direction = this.model.properties.direction.value();
    for (const i of indices) {
      if (isNaN(sx[i]+sy[i]+sradius[i]+_start_angle[i]+_end_angle[i])) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction);
      ctx.lineTo(sx[i], sy[i]);
      ctx.closePath();

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
    if (this.model.properties.radius.units === "data") {
      x0 = x - this.max_radius;
      x1 = x + this.max_radius;

      y0 = y - this.max_radius;
      y1 = y + this.max_radius;

    } else {
      sx0 = sx - this.max_radius;
      sx1 = sx + this.max_radius;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);

      sy0 = sy - this.max_radius;
      sy1 = sy + this.max_radius;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    }

    const candidates = [];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    for (const i of this.index.indices(bbox)) {
      const r2 = Math.pow(this.sradius[i], 2);
      [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i]);
      [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i]);
      dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2);
      if (dist <= r2) {
        candidates.push([i, dist]);
      }
    }

    const direction = this.model.properties.direction.value();
    const hits = [];
    for (const [i, dist] of candidates) {
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
}

export namespace Wedge {
  export interface Attrs extends XYGlyph.Attrs {
    direction: Direction
    radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
  }
}

export interface Wedge extends Wedge.Attrs {}

export class Wedge extends XYGlyph {

  static initClass() {
    this.prototype.type = 'Wedge';
    this.prototype.default_view = WedgeView;

    this.mixins(['line', 'fill']);
    this.define({
      direction:    [ p.Direction,   'anticlock' ],
      radius:       [ p.DistanceSpec             ],
      start_angle:  [ p.AngleSpec                ],
      end_angle:    [ p.AngleSpec                ],
    });
  }
}
Wedge.initClass();
