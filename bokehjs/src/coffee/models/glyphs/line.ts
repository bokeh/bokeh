/* XXX: partial */
import {XYGlyph, XYGlyphView} from "./xy_glyph";
import {PointGeometry, SpanGeometry} from "core/geometry";
import {LineMixinVector} from "core/property_mixins"
import * as hittest from "core/hittest"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection";

export class LineView extends XYGlyphView {
  model: Line

  _render(ctx: Context2d, indices, {sx, sy}) {
    let drawing = false;
    this.visuals.line.set_value(ctx);
    let last_index = null;

    for (const i of indices) {
      if (drawing) {
        if (!isFinite(sx[i]+sy[i])) {
          ctx.stroke();
          ctx.beginPath();
          drawing = false;
          last_index = i;
          continue;
        }

        if ((last_index !== null) && ((i-last_index) > 1)) {
          ctx.stroke();
          drawing = false;
        }
      }

      if (drawing) {
        ctx.lineTo(sx[i], sy[i]);
      } else {
        ctx.beginPath();
        ctx.moveTo(sx[i], sy[i]);
        drawing = true;
      }

      last_index = i;
    }

    if (drawing) {
      return ctx.stroke();
    }
  }

  _hit_point(geometry: PointGeometry): Selection {
    /* Check if the point geometry hits this line glyph and return an object
    that describes the hit result:
      Args:
        * geometry (object): object with the following keys
          * sx (float): screen x coordinate of the point
          * sy (float): screen y coordinate of the point
          * type (str): type of geometry (in this case it's a point)
      Output:
        Object with the following keys:
          * 0d (bool): whether the point hits the glyph or not
          * 1d (array(int)): array with the indices hit by the point
    */
    const result = hittest.create_empty_hit_test_result();
    const point = {x: geometry.sx, y: geometry.sy};
    let shortest = 9999;
    const threshold = Math.max(2, this.visuals.line.line_width.value() / 2);

    for (let i = 0, end = this.sx.length-1; i < end; i++) {
      const [p0, p1] = [{x: this.sx[i], y: this.sy[i]}, {x: this.sx[i+1], y: this.sy[i+1]}];
      const dist = hittest.dist_to_segment(point, p0, p1);

      if ((dist < threshold) && (dist < shortest)) {
        shortest = dist;
        result.add_to_selected_glyphs(this.model)
        result.get_view = () => this
        result.line_indices = [i]
      }
    }

    return result;
  }

  _hit_span(geometry: SpanGeometry): Selection {
    let val, values;
    const {sx, sy} = geometry;
    const result = hittest.create_empty_hit_test_result();

    if (geometry.direction === 'v') {
      val = this.renderer.yscale.invert(sy);
      values = this._y;
    } else {
      val = this.renderer.xscale.invert(sx);
      values = this._x;
    }

    for (let i = 0, end = values.length-1; i < end; i++) {
      if ((values[i]<=val && val<=values[i+1]) || (values[i+1]<=val && val<=values[i])) {
        result.add_to_selected_glyphs(this.model)
        result.get_view = () => this
        result.line_indices.push(i)
      }
    }

    return result;
  }

  get_interpolation_hit(i, geometry: PointGeometry | SpanGeometry){
    let x0, x1, y0, y1;
    const {sx, sy} = geometry;
    const [x2, y2, x3, y3] = [this._x[i], this._y[i], this._x[i+1], this._y[i+1]];

    if (geometry.type === 'point') {
      [y0, y1] = this.renderer.yscale.r_invert(sy-1, sy+1);
      [x0, x1] = this.renderer.xscale.r_invert(sx-1, sx+1);
    } else {
      if (geometry.direction === 'v') {
        [y0, y1] = this.renderer.yscale.r_invert(sy, sy);
        [x0, x1] = [x2, x3];
      } else {
        [x0, x1] = this.renderer.xscale.r_invert(sx, sx);
        [y0, y1] = [y2, y3];
      }
    }

    const res = hittest.check_2_segments_intersect(x0, y0, x1, y1, x2, y2, x3, y3);
    return [res.x, res.y];
  }

  draw_legend_for_index(ctx: Context2d, x0, x1, y0, y1, index) {
    return this._generic_line_legend(ctx, x0, x1, y0, y1, index);
  }
}

export namespace Line {
  export interface Mixins extends LineMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {}
}

export interface Line extends Line.Attrs {}

export class Line extends XYGlyph {

  constructor(attrs?: Partial<Line.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Line';
    this.prototype.default_view = LineView;

    this.mixins(['line']);
  }
}
Line.initClass();
