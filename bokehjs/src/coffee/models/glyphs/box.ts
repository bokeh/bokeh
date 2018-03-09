/* XXX: partial */
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import {IBBox} from "core/util/bbox"
import {RBush} from "core/util/spatial";
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph";
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry";
import * as hittest from "core/hittest";
import {Selection} from "../selections/selection";

// Not a publicly exposed Glyph, exists to factor code for bars and quads

export interface BoxData extends GlyphData {
}

export interface BoxView extends BoxData {}

export abstract class BoxView extends GlyphView {
  model: Box
  visuals: Box.Visuals

  _index_box(len): RBush {
    const points = [];

    for (let i = 0, end = len; i < end; i++) {
      const [l, r, t, b] = this._lrtb(i);
      if (isNaN(l+r+t+b) || !isFinite(l+r+t+b)) {
        continue;
      }
      points.push({minX: l, minY: b, maxX: r, maxY: t, i});
    }

    return new RBush(points);
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sleft, sright, stop, sbottom}: BoxData): void {
    for (const i of indices) {
      if (isNaN(sleft[i] + stop[i] + sright[i] + sbottom[i]))
        continue;

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

  _hit_rect(geometry: RectGeometry): Selection {
    return this._hit_rect_against_index(geometry);
  }

  _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    const hits = this.index.indices({minX: x, minY: y, maxX: x, maxY: y});

    const result = hittest.create_empty_hit_test_result();
    result.indices = hits;
    return result;
  }

  _hit_span(geometry: SpanGeometry): Selection {
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

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    this._generic_area_legend(ctx, bbox, index);
  }
}

export namespace Box {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends Glyph.Attrs, Mixins {}

  export interface Props extends Glyph.Props {}

  export interface Visuals extends Glyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface Box extends Box.Attrs {}

export abstract class Box extends Glyph {

  properties: Box.Props

  constructor(attrs?: Partial<Box.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Box";

    this.mixins(['line', 'fill']);
  }
}
Box.initClass();
