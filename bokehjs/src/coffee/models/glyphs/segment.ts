/* XXX: partial */
import * as hittest from "core/hittest";
import {NumberSpec} from "core/vectorization"
import {RBush} from "core/util/spatial";
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"

export class SegmentView extends GlyphView {
  model: Segment

  _index_data() {
    const points = [];
    for (let i = 0, end = this._x0.length; i < end; i++) {
      if (!isNaN(this._x0[i] + this._x1[i] + this._y0[i] + this._y1[i])) {
        points.push({
          minX: Math.min(this._x0[i], this._x1[i]),
          minY: Math.min(this._y0[i], this._y1[i]),
          maxX: Math.max(this._x0[i], this._x1[i]),
          maxY: Math.max(this._y0[i], this._y1[i]),
          i,
        });
      }
    }

    return new RBush(points);
  }

  _render(ctx: Context2d, indices, {sx0, sy0, sx1, sy1}) {
    if (this.visuals.line.doit) {
      for (const i of indices) {
        if (isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i])) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(sx0[i], sy0[i]);
        ctx.lineTo(sx1[i], sy1[i]);

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  _hit_point(geometry) {
    const {sx, sy} = geometry;
    const point = {x: sx, y: sy};

    const hits = [];
    const lw_voffset = 2; // FIXME: Use maximum of segments line_width/2 instead of magic constant 2

    const [minX, maxX] = this.renderer.xscale.r_invert(sx-lw_voffset, sx+lw_voffset);
    const [minY, maxY] = this.renderer.yscale.r_invert(sy-lw_voffset, sy+lw_voffset);
    const candidates = this.index.indices({minX, minY, maxX, maxY});

    for (const i of candidates) {
      const threshold2 = Math.pow(Math.max(2, this.visuals.line.cache_select('line_width', i) / 2), 2);
      const [p0, p1] = [{x: this.sx0[i], y: this.sy0[i]}, {x: this.sx1[i], y: this.sy1[i]}];
      const dist2 = hittest.dist_to_segment_squared(point, p0, p1);
      if (dist2 < threshold2) {
        hits.push(i);
      }
    }

    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }

  _hit_span(geometry) {
    let v0, v1, val;
    const [hr, vr] = this.renderer.plot_view.frame.bbox.ranges;
    const {sx, sy} = geometry;

    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy);
      [v0, v1] = [this._y0, this._y1];
    } else {
      val = this.renderer.xscale.invert(sx);
      [v0, v1] = [this._x0, this._x1];
    }

    const hits = [];

    const [minX, maxX] = this.renderer.xscale.r_invert(hr.start, hr.end);
    const [minY, maxY] = this.renderer.yscale.r_invert(vr.start, vr.end);
    const candidates = this.index.indices({minX, minY, maxX, maxY});

    for (const i of candidates) {
      if ((v0[i]<=val && val<=v1[i]) || (v1[i]<=val && val<=v0[i])) {
        hits.push(i);
      }
    }

    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }

  scx(i) {
    return (this.sx0[i] + this.sx1[i])/2;
  }

  scy(i) {
    return (this.sy0[i] + this.sy1[i])/2;
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Segment {
  export interface Attrs extends Glyph.Attrs {
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec
  }

  export interface Opts extends Glyph.Opts {}
}

export interface Segment extends Segment.Attrs {}

export class Segment extends Glyph {

  constructor(attrs?: Partial<Segment.Attrs>, opts?: Segment.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Segment';
    this.prototype.default_view = SegmentView;

    this.coords([['x0', 'y0'], ['x1', 'y1']]);
    this.mixins(['line']);
  }
}
Segment.initClass();
