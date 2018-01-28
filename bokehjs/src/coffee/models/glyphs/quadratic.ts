/* XXX: partial */
import {NumberSpec} from "core/vectorization"
import {RBush} from "core/util/spatial";
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"

// Formula from: http://pomax.nihongoresources.com/pages/bezier/
//
// if segment is quadratic bezier do:
//   for both directions do:
//     if control between start and end, compute linear bounding box
//     otherwise, compute
//       bound = u(1-t)^2 + 2v(1-t)t + wt^2
//         (with t = ((u-v) / (u-2v+w)), with {u = start, v = control, w = end})
//       if control precedes start, min = bound, otherwise max = bound

const _qbb = function(u, v, w) {
  if (v === ((u+w)/2)) {
    return [u, w];
  } else {
    const t = (u-v) / ((u-(2*v))+w);
    const bd = (u*Math.pow((1-t), 2)) + (2*v*(1-t)*t) + (w*Math.pow(t, 2));
    return [Math.min(u, w, bd), Math.max(u, w, bd)];
  }
};

export class QuadraticView extends GlyphView {
  model: Quadratic

  _index_data() {
    const points = [];
    for (let i = 0, end = this._x0.length; i < end; i++) {
      if (isNaN(this._x0[i] + this._x1[i] + this._y0[i] + this._y1[i] + this._cx[i] + this._cy[i])) {
        continue;
      }

      const [x0, x1] = _qbb(this._x0[i], this._cx[i], this._x1[i]);
      const [y0, y1] = _qbb(this._y0[i], this._cy[i], this._y1[i]);

      points.push({minX: x0, minY: y0, maxX: x1, maxY: y1, i});
    }

    return new RBush(points);
  }

  _render(ctx: Context2d, indices, {sx0, sy0, sx1, sy1, scx, scy}) {
    if (this.visuals.line.doit) {
      for (const i of indices) {
        if (isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i]+scx[i]+scy[i])) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(sx0[i], sy0[i]);
        ctx.quadraticCurveTo(scx[i], scy[i], sx1[i], sy1[i]);

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Quadratic {
  export interface Attrs extends Glyph.Attrs {
    x0: NumberSpec
    y0: NumberSpec
    x1: NumberSpec
    y1: NumberSpec
    cx: NumberSpec
    cy: NumberSpec
  }

  export interface Opts extends Glyph.Opts {}
}

export interface Quadratic extends Quadratic.Attrs {}

export class Quadratic extends Glyph {

  constructor(attrs?: Partial<Quadratic.Attrs>, opts?: Quadratic.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Quadratic';
    this.prototype.default_view = QuadraticView;

    this.coords([['x0', 'y0'], ['x1', 'y1'], ['cx', 'cy']]);
    this.mixins(['line']);
  }
}
Quadratic.initClass();
