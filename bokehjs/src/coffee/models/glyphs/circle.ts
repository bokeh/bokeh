/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {Dimension} from "core/enums"
import * as hittest from "core/hittest";
import * as p from "core/properties"
import {range, map} from "core/util/array"

export class CircleView extends XYGlyphView {
  model: Circle

  _map_data(): void {
    // NOTE: Order is important here: size is always present (at least
    // a default), but radius is only present if a user specifies it
    if (this._radius != null) {
      if (this.model.properties.radius.spec.units === "data") {
        const rd = this.model.properties.radius_dimension.spec.value;
        this.sradius = this.sdist(this.renderer[`${rd}scale`], this[`_${rd}`], this._radius);
      } else {
        this.sradius = this._radius;
        this.max_size = 2 * this.max_radius;
      }
    } else
      this.sradius = map(this._size, (s: number) => s/2)
  }

  _mask_data(_all_indices) {
    let sx0, sx1, sy0, sy1, x0, x1, y0, y1;
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges;

    // check for radius first
    if ((this._radius != null) && (this.model.properties.radius.units === "data")) {
      sx0 = hr.start;
      sx1 = hr.end;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
      x0 -= this.max_radius;
      x1 += this.max_radius;

      sy0 = vr.start;
      sy1 = vr.end;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
      y0 -= this.max_radius;
      y1 += this.max_radius;

    } else {
      sx0 = hr.start - this.max_size;
      sx1 = hr.end + this.max_size;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);

      sy0 = vr.start - this.max_size;
      sy1 = vr.end + this.max_size;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    }

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    return this.index.indices(bbox);
  }

  _render(ctx, indices, {sx, sy, sradius}) {
    for (const i of indices) {
      if (isNaN(sx[i]+sy[i]+sradius[i])) {
        continue;
      }

      ctx.beginPath();
      ctx.arc(sx[i], sy[i], sradius[i], 0, 2*Math.PI, false);

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
    let dist, r2, sx0, sx1, sy0, sy1, x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    // check radius first
    if ((this._radius != null) && (this.model.properties.radius.units === "data")) {
      x0 = x - this.max_radius;
      x1 = x + this.max_radius;

      y0 = y - this.max_radius;
      y1 = y + this.max_radius;

    } else {
      sx0 = sx - this.max_size;
      sx1 = sx + this.max_size;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
      [x0, x1] = [Math.min(x0, x1), Math.max(x0, x1)];

      sy0 = sy - this.max_size;
      sy1 = sy + this.max_size;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
      [y0, y1] = [Math.min(y0, y1), Math.max(y0, y1)];
    }

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const candidates = this.index.indices(bbox);

    const hits = [];
    if ((this._radius != null) && (this.model.properties.radius.units === "data")) {
      for (const i of candidates) {
        r2 = Math.pow(this.sradius[i], 2);
        [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i]);
        [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i]);
        dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2);
        if (dist <= r2) {
          hits.push([i, dist]);
        }
      }
    } else {
      for (const i of candidates) {
        r2 = Math.pow(this.sradius[i], 2);
        dist = Math.pow(this.sx[i]-sx, 2) + Math.pow(this.sy[i]-sy, 2);
        if (dist <= r2) {
          hits.push([i, dist]);
        }
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
        // use circle bounds instead of current pointer y coordinates
        let sx0, sx1;
        y0 = minY;
        y1 = maxY;
        if ((this._radius != null) && (this.model.properties.radius.units === "data")) {
          sx0 = sx - this.max_radius;
          sx1 = sx + this.max_radius;
          [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
        } else {
          ms = this.max_size/2;
          sx0 = sx - ms;
          sx1 = sx + ms;
          [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
        }
      } else {
        // use circle bounds instead of current pointer x coordinates
        let sy0, sy1;
        x0 = minX;
        x1 = maxX;
        if ((this._radius != null) && (this.model.properties.radius.units === "data")) {
          sy0 = sy - this.max_radius;
          sy1 = sy + this.max_radius;
          [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
        } else {
          ms = this.max_size/2;
          sy0 = sy - ms;
          sy1 = sy + ms;
          [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
        }
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
    for (let i = 0, end = candidates.length; i < end; i++) {
      const idx = candidates[i];
      if (hittest.point_in_poly(this.sx[i], this.sy[i], sx, sy)) {
        hits.push(idx);
      }
    }

    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }

  // circle does not inherit from marker (since it also accepts radius) so we
  // must supply a draw_legend for it  here
  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    // using objects like this seems a little wonky, since the keys are coerced to
    // stings, but it works
    const indices = [index];
    const sx = { };
    sx[index] = (x0+x1)/2;
    const sy = { };
    sy[index] = (y0+y1)/2;
    const sradius = { };
    sradius[index] = Math.min(Math.abs(x1-x0), Math.abs(y1-y0))*0.2;

    const data = {sx, sy, sradius};
    return this._render(ctx, indices, data);
  }
}

export namespace Circle {
  export interface Attrs extends XYGlyph.Attrs {
    angle: AngleSpec
    size: DistanceSpec
    radius: DistanceSpec | null
    radius_dimension: Dimension
  }
}

export interface Circle extends Circle.Attrs {}

export class Circle extends XYGlyph {

  static initClass() { // XXX: Marker
    this.prototype.type = 'Circle';
    this.prototype.default_view = CircleView;

    this.mixins(['line', 'fill']);
    this.define({
      angle:            [ p.AngleSpec,    0                             ],
      size:             [ p.DistanceSpec, { units: "screen", value: 4 } ],
      radius:           [ p.DistanceSpec, null                          ],
      radius_dimension: [ p.String,       'x'                           ],
    });
  }

  initialize(): void {
    super.initialize();
    this.properties.radius.optional = true;
  }
}
Circle.initClass();
