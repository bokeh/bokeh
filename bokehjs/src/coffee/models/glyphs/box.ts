/* XXX: partial */
import {RBush} from "core/util/spatial";
import {Glyph, GlyphView} from "./glyph";
import * as hittest from "core/hittest";
import * as p from "core/properties"

// Not a publicly exposed Glyph, exists to factor code for bars and quads

export class BoxView extends GlyphView {

  _index_box(len) {
    const points = [];

    for (let i = 0, end = len, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      const [l, r, t, b] = this._lrtb(i);
      if (isNaN(l+r+t+b) || !isFinite(l+r+t+b)) {
        continue;
      }
      points.push({minX: l, minY: b, maxX: r, maxY: t, i});
    }

    return new RBush(points);
  }

  _render(ctx, indices, {sleft, sright, stop, sbottom}) {
    for (let i of indices) {
      if (isNaN(sleft[i]+stop[i]+sright[i]+sbottom[i])) {
        continue;
      }

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i);
        ctx.fillRect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i]);
      }

      if (this.visuals.line.doit) {
        ctx.beginPath();
        ctx.rect(sleft[i], stop[i], sright[i]-sleft[i], sbottom[i]-stop[i]);
        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  _hit_rect(geometry) {
    return this._hit_rect_against_index(geometry);
  }

  _hit_point(geometry) {
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    const hits = this.index.indices({minX: x, minY: y, maxX: x, maxY: y});

    const result = hittest.create_empty_hit_test_result();
    result.indices = hits;
    return result;
  }

  _hit_span(geometry) {
    let hits, maxX, minX;
    const {sx, sy} = geometry;

    if (geometry.direction === 'v') {
      const y = this.renderer.yscale.invert(sy);
      const hr = this.renderer.plot_view.frame.bbox.h_range;
      [minX, maxX] = this.renderer.xscale.r_invert(hr.start, hr.end);
      hits = this.index.indices({ minX, minY: y, maxX, maxY: y });
    } else {
      const x = this.renderer.xscale.invert(sx);
      const vr = this.renderer.plot_view.frame.bbox.v_range;
      const [minY, maxY] = this.renderer.yscale.r_invert(vr.start, vr.end);
      hits = this.index.indices({ minX: x, minY, maxX: x, maxY });
    }

    const result = hittest.create_empty_hit_test_result();
    result.indices = hits;
    return result;
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_area_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Box extends Glyph {
  static initClass() {
    this.mixins(['line', 'fill']);
  }
}
Box.initClass();
