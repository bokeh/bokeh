import {RBush} from "core/util/spatial";
import {Glyph, GlyphView} from "./glyph"

export class XYGlyphView extends GlyphView {

  _index_data() {
    const points = [];

    for (let i = 0, end = this._x.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      const x = this._x[i];
      const y = this._y[i];
      if (isNaN(x+y) || !isFinite(x+y)) {
        continue;
      }
      points.push({minX: x, minY: y, maxX: x, maxY: y, i});
    }

    return new RBush(points);
  }
}

export class XYGlyph extends Glyph {
  static initClass() {
    this.prototype.type = "XYGlyph";
    this.prototype.default_view = XYGlyphView;

    this.coords([['x', 'y']]);
  }
}
XYGlyph.initClass();
