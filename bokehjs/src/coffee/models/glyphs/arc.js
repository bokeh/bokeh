/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {XYGlyph, XYGlyphView} from "./xy_glyph";
import * as p from "core/properties"
;

export class ArcView extends XYGlyphView {

  _map_data() {
    if (this.model.properties.radius.units === "data") {
      return this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius);
    } else {
      return this.sradius = this._radius;
    }
  }

  _render(ctx, indices, {sx, sy, sradius, _start_angle, _end_angle}) {
    if (this.visuals.line.doit) {
      const direction = this.model.properties.direction.value();
      for (let i of Array.from(indices)) {
        if (isNaN(sx[i]+sy[i]+sradius[i]+_start_angle[i]+_end_angle[i])) {
          continue;
        }

        ctx.beginPath();
        ctx.arc(sx[i], sy[i], sradius[i], _start_angle[i], _end_angle[i], direction);

        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  draw_legend_for_index(ctx, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export class Arc extends XYGlyph {
  static initClass() {
    this.prototype.default_view = ArcView;

    this.prototype.type = 'Arc';

    this.mixins(['line']);
    this.define({
        direction:   [ p.Direction,   'anticlock' ],
        radius:      [ p.DistanceSpec             ],
        start_angle: [ p.AngleSpec                ],
        end_angle:   [ p.AngleSpec                ]
      });
  }
}
Arc.initClass();
