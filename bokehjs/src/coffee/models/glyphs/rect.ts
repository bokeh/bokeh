/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import * as hittest from "core/hittest";
import * as p from "core/properties";
import {max} from "core/util/array";
import {Context2d} from "core/util/canvas"

export class RectView extends XYGlyphView {
  model: Rect

  _set_data() {
    this.max_w2 = 0;
    if (this.model.properties.width.units === "data") {
      this.max_w2 = this.max_width/2;
    }
    this.max_h2 = 0;
    if (this.model.properties.height.units === "data") {
      return this.max_h2 = this.max_height/2;
    }
  }

  _map_data() {
    if (this.model.properties.width.units === "data") {
      [this.sw, this.sx0] = this._map_dist_corner_for_data_side_length(this._x, this._width, this.renderer.xscale, 0);
    } else {
      this.sw = this._width;
      this.sx0 = ((() => {
        const result = [];
        for (let i = 0, end = this.sx.length; i < end; i++) {
          result.push(this.sx[i] - (this.sw[i]/2));
        }
        return result;
      })());
    }
    if (this.model.properties.height.units === "data") {
      [this.sh, this.sy1] = this._map_dist_corner_for_data_side_length(this._y, this._height, this.renderer.yscale, 1);
    } else {
      this.sh = this._height;
      this.sy1 = ((() => {
        const result = [];
        for (let i = 0, end = this.sy.length; i < end; i++) {
          result.push(this.sy[i] - (this.sh[i]/2));
        }
        return result;
      })());
    }
    return this.ssemi_diag = ((() => {
      const result = [];
      for (let i = 0, end = this.sw.length; i < end; i++) {
        result.push(Math.sqrt((((this.sw[i]/2) * this.sw[i])/2) + (((this.sh[i]/2) * this.sh[i])/2)));
      }
      return result;
    })());
  }

  _render(ctx: Context2d, indices, {sx, sy, sx0, sy1, sw, sh, _angle}) {
    if (this.visuals.fill.doit) {
      for (const i of indices) {
        if (isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i])) {
          continue;
        }

        //no need to test the return value, we call fillRect for every glyph anyway
        this.visuals.fill.set_vectorize(ctx, i);

        if (_angle[i]) {
          ctx.translate(sx[i], sy[i]);
          ctx.rotate(_angle[i]);
          ctx.fillRect(-sw[i]/2, -sh[i]/2, sw[i], sh[i]);
          ctx.rotate(-_angle[i]);
          ctx.translate(-sx[i], -sy[i]);
        } else {
          ctx.fillRect(sx0[i], sy1[i], sw[i], sh[i]);
        }
      }
    }

    if (this.visuals.line.doit) {
      ctx.beginPath();

      for (const i of indices) {

        if (isNaN(sx[i] + sy[i] + sx0[i] + sy1[i] + sw[i] + sh[i] + _angle[i])) {
          continue;
        }

        // fillRect does not fill zero-height or -width rects, but rect(...)
        // does seem to stroke them (1px wide or tall). Explicitly ignore rects
        // with zero width or height to be consistent
        if ((sw[i]===0) || (sh[i]===0)) {
          continue;
        }

        if (_angle[i]) {
          ctx.translate(sx[i], sy[i]);
          ctx.rotate(_angle[i]);
          ctx.rect(-sw[i]/2, -sh[i]/2, sw[i], sh[i]);
          ctx.rotate(-_angle[i]);
          ctx.translate(-sx[i], -sy[i]);
        } else {
          ctx.rect(sx0[i], sy1[i], sw[i], sh[i]);
        }

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
        ctx.beginPath();
      }

      return ctx.stroke();
    }
  }

  _hit_rect(geometry) {
    return this._hit_rect_against_index(geometry);
  }

  _hit_point(geometry) {
    let {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    const scenter_x = ((() => {
      const result1 = [];
      for (let i = 0, end = this.sx0.length; i < end; i++) {
        result1.push(this.sx0[i] + (this.sw[i]/2));
      }
      return result1;
    })());
    const scenter_y = ((() => {
      const result2 = [];
      for (let i = 0, end = this.sy1.length; i < end; i++) {
        result2.push(this.sy1[i] + (this.sh[i]/2));
      }
      return result2;
    })());

    const max_x2_ddist = max(this._ddist(0, scenter_x, this.ssemi_diag));
    const max_y2_ddist = max(this._ddist(1, scenter_y, this.ssemi_diag));

    const x0 = x - max_x2_ddist;
    const x1 = x + max_x2_ddist;
    const y0 = y - max_y2_ddist;
    const y1 = y + max_y2_ddist;

    const hits = [];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    for (const i of this.index.indices(bbox)) {
      let height_in, width_in;
      if (this._angle[i]) {
        const s = Math.sin(-this._angle[i]);
        const c = Math.cos(-this._angle[i]);
        const px = ((c * (sx-this.sx[i])) - (s * (sy-this.sy[i]))) + this.sx[i];
        const py = (s * (sx-this.sx[i])) + (c * (sy-this.sy[i])) + this.sy[i];
        sx = px;
        sy = py;
        width_in = Math.abs(this.sx[i]-sx) <= (this.sw[i]/2);
        height_in = Math.abs(this.sy[i]-sy) <= (this.sh[i]/2);
      } else {
        width_in = ((sx - this.sx0[i]) <= this.sw[i]) && ((sx - this.sx0[i]) >= 0);
        height_in = ((sy - this.sy1[i]) <= this.sh[i]) && ((sy - this.sy1[i]) >= 0);
      }

      if (height_in && width_in) {
        hits.push(i);
      }
    }

    const result = hittest.create_hit_test_result();
    result['1d'].indices = hits;
    return result;
  }

  _map_dist_corner_for_data_side_length(coord, side_length, scale, dim) {
    let spt_corner;
    if (scale.source_range.synthetic != null) {
      coord = (coord.map((x) => scale.source_range.synthetic(x)));
    }
    const pt0 = ((() => {
      const result = [];
      for (let i = 0, end = coord.length; i < end; i++) {
        result.push(Number(coord[i]) - (side_length[i]/2));
      }
      return result;
    })());
    const pt1 = ((() => {
      const result = [];
      for (let i = 0, end = coord.length; i < end; i++) {
        result.push(Number(coord[i]) + (side_length[i]/2));
      }
      return result;
    })());
    const spt0 = scale.v_compute(pt0);
    const spt1 = scale.v_compute(pt1);
    const sside_length = this.sdist(scale, pt0, side_length, 'edge', this.model.dilate);
    if (dim === 0) {
      spt_corner = spt0;
      for (let i = 0, end = spt0.length; i < end; i++) {
        if (spt0[i] !== spt1[i]) {
          spt_corner = spt0[i] < spt1[i] ? spt0 : spt1;
          break;
        }
      }
      return [sside_length, spt_corner];
    } else if (dim === 1) {
      spt_corner = spt0;
      for (let i = 0, end = spt0.length; i < end; i++) {
        if (spt0[i] !== spt1[i]) {
          spt_corner = spt0[i] < spt1[i] ? spt0 : spt1;
          break;
        }
      }
      return [sside_length, spt_corner];
    }
  }

  _ddist(dim, spts, spans) {
    let scale;
    if (dim === 0) {
      scale = this.renderer.xscale;
    } else {
      scale = this.renderer.yscale;
    }

    const spt0 = spts;
    const spt1 = ((() => {
      const result = [];
      for (let i = 0, end = spt0.length; i < end; i++) {
        result.push(spt0[i] + spans[i]);
      }
      return result;
    })());

    const pt0 = scale.v_invert(spt0);
    const pt1 = scale.v_invert(spt1);

    return ((() => {
      const result = [];
      for (let i = 0, end = pt0.length; i < end; i++) {
        result.push(Math.abs(pt1[i] - pt0[i]));
      }
      return result;
    })());
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_area_legend(ctx, x0, x1, y0, y1, index);
  }

  _bounds(bds) {
    return this.max_wh2_bounds(bds);
  }
}

export namespace Rect {
  export interface Attrs extends XYGlyph.Attrs {
    angle: AngleSpec
    width: DistanceSpec
    height: DistanceSpec
    dilate: boolean
  }
}

export interface Rect extends Rect.Attrs {}

export class Rect extends XYGlyph {

  static initClass() {
    this.prototype.type = 'Rect';
    this.prototype.default_view = RectView;

    this.mixins(['line', 'fill']);
    this.define({
      angle:  [ p.AngleSpec,   0     ],
      width:  [ p.DistanceSpec       ],
      height: [ p.DistanceSpec       ],
      dilate: [ p.Bool,        false ],
    });
  }
}
Rect.initClass();
