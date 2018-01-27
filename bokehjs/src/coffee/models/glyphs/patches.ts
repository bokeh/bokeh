/* XXX: partial */
import {RBush} from "core/util/spatial";
import {Glyph, GlyphView} from "./glyph";
import {min, max, copy, findLastIndex} from "core/util/array";
import {isStrictNaN} from "core/util/types";
import {NumberSpec} from "core/vectorization"
import * as hittest from "core/hittest"

export class PatchesView extends GlyphView {
  model: Patches

  _build_discontinuous_object(nanned_qs) {
    // _s is @xs, @ys, @sxs, @sys
    // an object of n 1-d arrays in either data or screen units
    //
    // Each 1-d array gets broken to an array of arrays split
    // on any NaNs
    //
    // So:
    // { 0: [x11, x12],
    //   1: [x21, x22, x23],
    //   2: [x31, NaN, x32]
    // }
    // becomes
    // { 0: [[x11, x12]],
    //   1: [[x21, x22, x23]],
    //   2: [[x31],[x32]]
    // }
    const ds = {};
    for (let i = 0, end = nanned_qs.length; i < end; i++) {
      ds[i] = [];
      let qs = copy(nanned_qs[i]);
      while (qs.length > 0) {

        let qs_part;
        const nan_index = findLastIndex(qs, (q) => isStrictNaN(q));

        if (nan_index >= 0) {
          qs_part = qs.splice(nan_index);
        } else {
          qs_part = qs;
          qs = [];
        }

        const denanned = qs_part.filter((q) => !isStrictNaN(q))
        ds[i].push(denanned)
      }
    }
    return ds;
  }


  _index_data() {
    const xss = this._build_discontinuous_object(this._xs);
    const yss = this._build_discontinuous_object(this._ys);

    const points = [];
    for (let i = 0, end = this._xs.length; i < end; i++) {
      for (let j = 0, endj = xss[i].length; j < endj; j++) {
        const xs = xss[i][j];
        const ys = yss[i][j];
        if (xs.length === 0) {
          continue;
        }
        points.push({
          minX: min(xs),
          minY: min(ys),
          maxX: max(xs),
          maxY: max(ys),
          i,
        });
      }
    }

    return new RBush(points);
  }

  _mask_data(_all_indices) {
    const xr = this.renderer.plot_view.frame.x_ranges.default;
    const [x0, x1] = [xr.min, xr.max];

    const yr = this.renderer.plot_view.frame.y_ranges.default;
    const [y0, y1] = [yr.min, yr.max];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const indices = this.index.indices(bbox);

    // TODO (bev) this should be under test
    return indices.sort((a, b) => a-b);
  }

  _render(ctx, indices, {sxs, sys}) {
    // @sxss and @syss are used by _hit_point and sxc, syc
    // This is the earliest we can build them, and only build them once
    this.renderer.sxss = this._build_discontinuous_object(sxs);
    this.renderer.syss = this._build_discontinuous_object(sys);
    for (const i of indices) {
      const [sx, sy] = [sxs[i], sys[i]];

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i);

        for (let j = 0, end = sx.length; j < end; j++) {
          if (j === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[j], sy[j]);
            continue;
          } else if (isNaN(sx[j] + sy[j])) {
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[j], sy[j]);
          }
        }

        ctx.closePath();
        ctx.fill();
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i);

        for (let j = 0, end = sx.length; j < end; j++) {
          if (j === 0) {
            ctx.beginPath();
            ctx.moveTo(sx[j], sy[j]);
            continue;
          } else if (isNaN(sx[j] + sy[j])) {
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            continue;
          } else {
            ctx.lineTo(sx[j], sy[j]);
          }
        }

        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  _hit_point(geometry) {
    const {sx, sy} = geometry;

    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    const candidates = this.index.indices({minX: x, minY: y, maxX: x, maxY: y});

    const hits = [];
    for (let i = 0, end = candidates.length; i < end; i++) {
      const idx = candidates[i];
      const sxs = this.renderer.sxss[idx];
      const sys = this.renderer.syss[idx];
      for (let j = 0, endj = sxs.length; j < endj; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j])) {
          hits.push(idx);
        }
      }
    }

    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }

  _get_snap_coord(array) {
      let sum = 0;
      for (const s of array) {
        sum += s;
      }
      return sum / array.length;
    }

  scx(i, sx, sy) {
    if (this.renderer.sxss[i].length === 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sxs[i]);
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.renderer.sxss[i];
      const sys = this.renderer.syss[i];
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j])) {
          return this._get_snap_coord(sxs[j]);
        }
      }
    }
    return null;
  }

  scy(i, sx, sy) {
    if (this.renderer.syss[i].length === 1) {
      // We don't have discontinuous objects so we're ok
      return this._get_snap_coord(this.sys[i]);
    } else {
      // We have discontinuous objects, so we need to find which
      // one we're in, we can use point_in_poly again
      const sxs = this.renderer.sxss[i];
      const sys = this.renderer.syss[i];
      for (let j = 0, end = sxs.length; j < end; j++) {
        if (hittest.point_in_poly(sx, sy, sxs[j], sys[j])) {
          return this._get_snap_coord(sys[j]);
        }
      }
    }
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_area_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Patches {
  export interface Attrs extends Glyph.Attrs {
    xs: NumberSpec
    ys: NumberSpec
  }
}

export interface Patches extends Patches.Attrs {}

export class Patches extends Glyph {

  static initClass() {
    this.prototype.type = 'Patches';
    this.prototype.default_view = PatchesView;

    this.coords([['xs', 'ys']]);
    this.mixins(['line', 'fill']);
  }
}
Patches.initClass();
