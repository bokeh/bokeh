/* XXX: partial */
import {RBush} from "core/util/spatial";
import {Glyph, GlyphView} from "./glyph"

// algorithm adapted from http://stackoverflow.com/a/14429749/3406693
const _cbb = function(x0, y0, x1, y1, x2, y2, x3, y3) {
  let t;
  const tvalues = [];
  const bounds = [[], []];

  for (let i = 0; i <= 2; i++) {
    let a, b, c;
    if (i === 0) {
      b = ((6 * x0) - (12 * x1)) + (6 * x2);
      a = (((-3 * x0) + (9 * x1)) - (9 * x2)) + (3 * x3);
      c = (3 * x1) - (3 * x0);
    } else {
      b = ((6 * y0) - (12 * y1)) + (6 * y2);
      a = (((-3 * y0) + (9 * y1)) - (9 * y2)) + (3 * y3);
      c = (3 * y1) - (3 * y0);
    }

    if (Math.abs(a) < 1e-12) { // Numerical robustness
      if (Math.abs(b) < 1e-12) { // Numerical robustness
        continue;
      }
      t = -c / b;
      if ((0 < t) && (t < 1)) {
        tvalues.push(t);
      }
      continue;
    }

    const b2ac = (b * b) - (4 * c * a);
    const sqrtb2ac = Math.sqrt(b2ac);

    if (b2ac < 0) {
      continue;
    }

    const t1 = (-b + sqrtb2ac) / (2 * a);
    if ((0 < t1) && (t1 < 1)) {
      tvalues.push(t1);
    }

    const t2 = (-b - sqrtb2ac) / (2 * a);
    if ((0 < t2) && (t2 < 1)) {
      tvalues.push(t2);
    }
  }

  let j = tvalues.length;
  const jlen = j;
  while (j--) {
    t = tvalues[j];
    const mt = 1 - t;
    const x = ((mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) +
         (t * t * t * x3));
    bounds[0][j] = x;
    const y = ((mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) +
         (t * t * t * y3));
    bounds[1][j] = y;
  }

  bounds[0][jlen] = x0;
  bounds[1][jlen] = y0;
  bounds[0][jlen + 1] = x3;
  bounds[1][jlen + 1] = y3;

  return [
    Math.min.apply(null, bounds[0]),
    Math.max.apply(null, bounds[1]),
    Math.max.apply(null, bounds[0]),
    Math.min.apply(null, bounds[1]),
  ];
};

export class BezierView extends GlyphView {

  _index_data() {
    const points = [];
    for (let i = 0, end = this._x0.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      if (isNaN(this._x0[i]+this._x1[i]+this._y0[i]+this._y1[i]+this._cx0[i]+this._cy0[i]+this._cx1[i]+this._cy1[i])) {
        continue;
      }

      const [x0, y0, x1, y1] = _cbb(this._x0[i], this._y0[i], this._x1[i], this._y1[i], this._cx0[i], this._cy0[i], this._cx1[i], this._cy1[i]);
      points.push({minX: x0, minY: y0, maxX: x1, maxY: y1, i});
    }

    return new RBush(points);
  }

  _render(ctx, indices, {sx0, sy0, sx1, sy1, scx, scx0, scy0, scx1, scy1}) {
    if (this.visuals.line.doit) {
      for (let i of indices) {
        if (isNaN(sx0[i]+sy0[i]+sx1[i]+sy1[i]+scx0[i]+scy0[i]+scx1[i]+scy1[i])) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(sx0[i], sy0[i]);
        ctx.bezierCurveTo(scx0[i], scy0[i], scx1[i], scy1[i], sx1[i], sy1[i]);

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Bezier extends Glyph {
  static initClass() {
    this.prototype.default_view = BezierView;

    this.prototype.type = 'Bezier';

    this.coords([ ['x0', 'y0'], ['x1', 'y1'], ['cx0', 'cy0'], ['cx1', 'cy1'] ]);
    this.mixins(['line']);
  }
}
Bezier.initClass();
