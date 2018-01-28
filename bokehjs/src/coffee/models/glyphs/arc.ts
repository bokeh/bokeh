/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {Direction} from "core/enums"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"

export class ArcView extends XYGlyphView {
  model: Arc

  _map_data() {
    if (this.model.properties.radius.units === "data") {
      return this.sradius = this.sdist(this.renderer.xscale, this._x, this._radius);
    } else {
      return this.sradius = this._radius;
    }
  }

  _render(ctx: Context2d, indices, {sx, sy, sradius, _start_angle, _end_angle}) {
    if (this.visuals.line.doit) {
      const direction = this.model.properties.direction.value();
      for (const i of indices) {
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

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Arc {
  export interface Attrs extends XYGlyph.Attrs {
    direction: Direction
    radius: DistanceSpec
    start_angle: AngleSpec
    end_angle: AngleSpec
  }

  export interface Opts extends XYGlyph.Opts {}
}

export interface Arc extends Arc.Attrs {}

export class Arc extends XYGlyph {

  constructor(attrs?: Partial<Arc.Attrs>, opts?: Arc.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'Arc';
    this.prototype.default_view = ArcView;

    this.mixins(['line']);
    this.define({
      direction:   [ p.Direction,   'anticlock' ],
      radius:      [ p.DistanceSpec             ],
      start_angle: [ p.AngleSpec                ],
      end_angle:   [ p.AngleSpec                ],
    });
  }
}
Arc.initClass();
