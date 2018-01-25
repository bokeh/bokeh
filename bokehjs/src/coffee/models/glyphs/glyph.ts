/* XXX: partial */
import * as hittest from "core/hittest";
import * as p from "core/properties";
import * as bbox from "core/util/bbox";
import * as proj from "core/util/projections";
import {View} from "core/view";
import {Model} from "../../model";
import {Visuals} from "core/visuals";
import {logger} from "core/logging";
import {extend} from "core/util/object";
import {isArray} from "core/util/types";
import {LineView} from "./line"

export abstract class GlyphView extends View {
  model: Glyph

  initialize(options: any): void {
    super.initialize(options);
    this._nohit_warned = {};
    this.renderer = options.renderer;
    this.visuals = new Visuals(this.model);

    // Init gl (this should really be done anytime renderer is set,
    // and not done if it isn't ever set, but for now it only
    // matters in the unit tests because we build a view without a
    // renderer there)
    const { ctx } = this.renderer.plot_view.canvas_view;

    if (ctx.glcanvas != null) {
      let glglyphs;
      try {
        glglyphs = require("./webgl/index");
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          logger.warn('WebGL was requested and is supported, but bokeh-gl(.min).js is not available, falling back to 2D rendering.');
          glglyphs = null;
        } else {
          throw e;
        }
      }

      if (glglyphs != null) {
        const Cls = glglyphs[this.model.type + 'GLGlyph'];
        if (Cls != null) {
          this.glglyph = new Cls(ctx.glcanvas.gl, this);
        }
      }
    }
  }

  set_visuals(source) {
    this.visuals.warm_cache(source);

    if (this.glglyph != null) {
      return this.glglyph.set_visuals_changed();
    }
  }

  render(ctx, indices, data) {
    ctx.beginPath();

    if (this.glglyph != null) {
      if (this.glglyph.render(ctx, indices, data)) {
        return;
      }
    }

    return this._render(ctx, indices, data);
  }

  has_finished() { return true; }

  notify_finished() {
    return this.renderer.notify_finished();
  }

  bounds() {
    if ((this.index == null)) {
      return bbox.empty();
    } else {
      return this._bounds(this.index.bbox);
    }
  }

  log_bounds() {
    if ((this.index == null)) {
      return bbox.empty();
    }

    const bb = bbox.empty();
    const positive_x_bbs = this.index.search(bbox.positive_x());
    const positive_y_bbs = this.index.search(bbox.positive_y());
    for (const x of positive_x_bbs) {
      if (x.minX < bb.minX) {
        bb.minX = x.minX;
      }
      if (x.maxX > bb.maxX) {
        bb.maxX = x.maxX;
      }
    }
    for (const y of positive_y_bbs) {
      if (y.minY < bb.minY) {
        bb.minY = y.minY;
      }
      if (y.maxY > bb.maxY) {
        bb.maxY = y.maxY;
      }
    }

    return this._bounds(bb);
  }

  // this is available for subclasses to use, if appropriate.
  max_wh2_bounds(bds) {
    return {
        minX: bds.minX - this.max_w2,
        maxX: bds.maxX + this.max_w2,
        minY: bds.minY - this.max_h2,
        maxY: bds.maxY + this.max_h2,
    };
  }

  get_anchor_point(anchor, i, ...rest) {
    const [sx, sy] = rest[0];
    switch (anchor) {
      case "center": return {x: this.scx(i, sx, sy), y: this.scy(i, sx, sy)};
      default:       return null;
    }
  }

  // glyphs that need more sophisticated "snap to data" behaviour (like
  // snapping to a patch centroid, e.g, should override these
  scx(i, _sx, _sy) { return this.sx[i]; }
  scy(i, _sx, _sy) { return this.sy[i]; }

  sdist(scale, pts, spans, pts_location = "edge", dilate = false) {
    let pt0, pt1;
    if (scale.source_range.v_synthetic != null) {
      pts = scale.source_range.v_synthetic(pts);
    }

    if (pts_location === 'center') {
      const halfspan = (spans.map((d) => d / 2));
      pt0 = ((() => {
        const result = [];
        for (let i = 0, end = pts.length; i < end; i++) {
          result.push(pts[i] - halfspan[i]);
        }
        return result;
      })());
      pt1 = ((() => {
        const result = [];
        for (let i = 0, end = pts.length; i < end; i++) {
          result.push(pts[i] + halfspan[i]);
        }
        return result;
      })());
    } else {
      pt0 = pts;
      pt1 = ((() => {
        const result = [];
        for (let i = 0, end = pt0.length; i < end; i++) {
          result.push(pt0[i] + spans[i]);
        }
        return result;
      })());
    }

    const spt0 = scale.v_compute(pt0);
    const spt1 = scale.v_compute(pt1);

    if (dilate) {
      return ((() => {
        const result = [];
        for (let i = 0, end = spt0.length; i < end; i++) {
          result.push(Math.ceil(Math.abs(spt1[i] - spt0[i])));
        }
        return result;
      })());
    } else {
      return ((() => {
        const result = [];
        for (let i = 0, end = spt0.length; i < end; i++) {
          result.push(Math.abs(spt1[i] - spt0[i]));
        }
        return result;
      })());
    }
  }

  draw_legend_for_index(_ctx, _x0, _x1, _y0, _y1, _index) {
    return null;
  }

  _generic_line_legend(ctx, x0, x1, y0, y1, index) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, (y0 + y1) /2);
    ctx.lineTo(x1, (y0 + y1) /2);
    if (this.visuals.line.doit) {
      this.visuals.line.set_vectorize(ctx, index);
      ctx.stroke();
    }
    return ctx.restore();
  }

  _generic_area_legend(ctx, x0, x1, y0, y1, index) {
    const w = Math.abs(x1-x0);
    const dw = w*0.1;
    const h = Math.abs(y1-y0);
    const dh = h*0.1;

    const sx0 = x0 + dw;
    const sx1 = x1 - dw;

    const sy0 = y0 + dh;
    const sy1 = y1 - dh;

    if (this.visuals.fill.doit) {
      this.visuals.fill.set_vectorize(ctx, index);
      ctx.fillRect(sx0, sy0, sx1-sx0, sy1-sy0);
    }

    if (this.visuals.line.doit) {
      ctx.beginPath();
      ctx.rect(sx0, sy0, sx1-sx0, sy1-sy0);
      this.visuals.line.set_vectorize(ctx, index);
      return ctx.stroke();
    }
  }

  hit_test(geometry) {
    let result = null;

    const func = `_hit_${geometry.type}`;
    if (this[func] != null) {
      result = this[func](geometry);
    } else if ((this._nohit_warned[geometry.type] == null)) {
      logger.debug(`'${geometry.type}' selection not available for ${this.model.type}`);
      this._nohit_warned[geometry.type] = true;
    }

    return result;
  }

  _hit_rect_against_index(geometry) {
    const {sx0, sx1, sy0, sy1} = geometry;
    const [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);
    const [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    const bb = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    const result = hittest.create_hit_test_result();
    result['1d'].indices = this.index.indices(bb);
    return result;
  }

  set_data(source, indices, indices_to_update) {
    let data = this.model.materialize_dataspecs(source);

    this.visuals.set_all_indices(indices);
    if (indices && !(this instanceof LineView)) {
      const data_subset = {};
      for (const k in data) {
        const v = data[k];
        if (k.charAt(0) === '_') {
          data_subset[k] = (indices.map((i) => v[i]));
        } else {
          data_subset[k] = v;
        }
      }
      data = data_subset;
    }

    extend(this, data);

    if (this.renderer.plot_view.model.use_map) {
      if (this._x != null) {
        [this._x, this._y] = proj.project_xy(this._x, this._y);
      }
      if (this._xs != null) {
        [this._xs, this._ys] = proj.project_xsys(this._xs, this._ys);
      }
    }

    // if we have any coordinates that are categorical, convert them to
    // synthetic coords here
    if (this.renderer.plot_view.frame.x_ranges != null) {   // XXXX JUST TEMP FOR TESTS TO PASS
      const xr = this.renderer.plot_view.frame.x_ranges[this.model.x_range_name];
      const yr = this.renderer.plot_view.frame.y_ranges[this.model.y_range_name];
      for (let [xname, yname] of this.model._coords) {
        xname = `_${xname}`;
        yname = `_${yname}`;
        if (xr.v_synthetic != null) {
          this[xname] = xr.v_synthetic(this[xname]);
        }
        if (yr.v_synthetic != null) {
          this[yname] = yr.v_synthetic(this[yname]);
        }
      }
    }

    if (this.glglyph != null) {
      this.glglyph.set_data_changed(this._x.length);
    }

    this._set_data(source, indices_to_update); //TODO doesn't take subset indices into account

    return this.index = this._index_data();
  }

  _set_data(_source, _indices) {}

  _index_data() {}

  mask_data(indices) {
    // WebGL can do the clipping much more efficiently
    if (this.glglyph != null) { return indices; } else { return this._mask_data(indices); }
  }

  _mask_data(indices) { return indices; }

  _bounds(bounds) { return bounds; }

  map_data() {
    // todo: if using gl, skip this (when is this called?)

    // map all the coordinate fields
    for (let [xname, yname] of this.model._coords) {
      const sxname = `s${xname}`;
      const syname = `s${yname}`;
      xname = `_${xname}`;
      yname = `_${yname}`;
      if (isArray(this[xname] != null ? this[xname][0] : undefined) || __guard__(this[xname] != null ? this[xname][0] : undefined, x => x.buffer) instanceof ArrayBuffer) {
        [ this[sxname], this[syname] ] = [ [], [] ];
        for (let i = 0, end = this[xname].length; i < end; i++) {
          const [sx, sy] = this.map_to_screen(this[xname][i], this[yname][i]);
          this[sxname].push(sx);
          this[syname].push(sy);
        }
      } else {
        [ this[sxname], this[syname] ] = this.map_to_screen(this[xname], this[yname]);
      }
    }

    return this._map_data();
  }

  // This is where specs not included in coords are computed, e.g. radius.
  _map_data() {}

  map_to_screen(x, y) {
    return this.renderer.plot_view.map_to_screen(x, y, this.model.x_range_name, this.model.y_range_name);
  }
}

export namespace Glyph {
  export interface Attrs extends Model.Attrs {
    x_range_name: string
    y_range_name: string
  }
}

export interface Glyph extends Model, Glyph.Attrs {}

export abstract class Glyph extends Model {

  static initClass() {
    this.prototype.type = 'Glyph';

    this.prototype._coords = [];

    this.internal({
      x_range_name: [ p.String,      'default' ],
      y_range_name: [ p.String,      'default' ],
    });
  }

  static coords(coords) {
    const _coords = this.prototype._coords.concat(coords);
    this.prototype._coords = _coords;

    const result = {};
    for (const [x, y] of coords) {
      result[x] = [ p.NumberSpec ];
      result[y] = [ p.NumberSpec ];
    }

    return this.define(result);
  }
}
Glyph.initClass();

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
