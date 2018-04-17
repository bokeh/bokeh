import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph";
import {generic_area_legend} from "./utils"
import {PointGeometry} from "core/geometry";
import {DistanceSpec, AngleSpec} from "core/vectorization"
import {LineMixinVector, FillMixinVector} from "core/property_mixins"
import {Arrayable} from "core/types"
import {Direction} from "core/enums"
import {Line, Fill} from "core/visuals"
import * as hittest from "core/hittest";
import * as p from "core/properties";
import {IBBox} from "core/util/bbox"
import {angle_between} from "core/util/math"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection";

export interface AnnularWedgeData extends XYGlyphData {
  _inner_radius: Arrayable<number>
  _outer_radius: Arrayable<number>
  _start_angle: Arrayable<number>
  _end_angle: Arrayable<number>
  _angle: Arrayable<number>

  sinner_radius: Arrayable<number>
  souter_radius: Arrayable<number>

  max_inner_radius: number
  max_outer_radius: number
}

export interface AnnularWedgeView extends AnnularWedgeData {}

export class AnnularWedgeView extends XYGlyphView {
  model: AnnularWedge
  visuals: AnnularWedge.Visuals

  protected _map_data(): void {
    if (this.model.properties.inner_radius.units == "data")
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this._inner_radius);
    else
      this.sinner_radius = this._inner_radius;

    if (this.model.properties.outer_radius.units == "data")
      this.souter_radius = this.sdist(this.renderer.xscale, this._x, this._outer_radius);
    else
      this.souter_radius = this._outer_radius;

    this._angle = new Float32Array(this._start_angle.length)

    for (let i = 0, end = this._start_angle.length; i < end; i++) {
      this._angle[i] = this._end_angle[i] - this._start_angle[i]
    }
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sx, sy, _start_angle, _angle, sinner_radius, souter_radius}: AnnularWedgeData): void {
    const direction = this.model.properties.direction.value();

    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sinner_radius[i] + souter_radius[i] + _start_angle[i] + _angle[i]))
        continue;

      ctx.translate(sx[i], sy[i]);
      ctx.rotate(_start_angle[i]);

      ctx.moveTo(souter_radius[i], 0);
      ctx.beginPath();
      ctx.arc(0, 0, souter_radius[i], 0, _angle[i], direction);
      ctx.rotate(_angle[i]);
      ctx.lineTo(sinner_radius[i], 0);
      ctx.arc(0, 0, sinner_radius[i], 0, -_angle[i], !direction);
      ctx.closePath();

      ctx.rotate(-_angle[i]-_start_angle[i]);
      ctx.translate(-sx[i], -sy[i]);

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i);
        ctx.fill();
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i);
        ctx.stroke();
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry;
    const x = this.renderer.xscale.invert(sx);
    const y = this.renderer.yscale.invert(sy);

    // check radius first
    let x0: number, y0: number
    let x1: number, y1: number
    if (this.model.properties.outer_radius.units == "data") {
      x0 = x - this.max_outer_radius;
      x1 = x + this.max_outer_radius;

      y0 = y - this.max_outer_radius;
      y1 = y + this.max_outer_radius;
    } else {
      const sx0 = sx - this.max_outer_radius;
      const sx1 = sx + this.max_outer_radius;
      [x0, x1] = this.renderer.xscale.r_invert(sx0, sx1);

      const sy0 = sy - this.max_outer_radius;
      const sy1 = sy + this.max_outer_radius;
      [y0, y1] = this.renderer.yscale.r_invert(sy0, sy1);
    }

    const candidates = [];

    const bbox = hittest.validate_bbox_coords([x0, x1], [y0, y1]);
    for (const i of this.index.indices(bbox)) {
      const or2 = Math.pow(this.souter_radius[i], 2);
      const ir2 = Math.pow(this.sinner_radius[i], 2);
      const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i]);
      const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i]);
      const dist = Math.pow(sx0-sx1, 2) + Math.pow(sy0-sy1, 2);
      if (dist <= or2 && dist >= ir2)
        candidates.push([i, dist]);
    }

    const direction = this.model.properties.direction.value();
    const hits: [number, number][] = [];
    for (const [i, dist] of candidates) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(sy-this.sy[i], sx-this.sx[i]);
      if (angle_between(-angle, -this._start_angle[i], -this._end_angle[i], direction)) {
        hits.push([i, dist]);
      }
    }

    return hittest.create_hit_test_result_from_hits(hits);
  }

  draw_legend_for_index(ctx: Context2d, bbox: IBBox, index: number): void {
    generic_area_legend(this.visuals, ctx, bbox, index)
  }

  private _scenterxy(i: number): {x: number, y: number} {
    const r = (this.sinner_radius[i] + this.souter_radius[i])/2;
    const a = (this._start_angle[i]  + this._end_angle[i])   /2;
    return {x: this.sx[i] + (r*Math.cos(a)), y: this.sy[i] + (r*Math.sin(a))};
  }

  scenterx(i: number): number {
    return this._scenterxy(i).x
  }

  scentery(i: number): number {
    return this._scenterxy(i).y
  }
}

export namespace AnnularWedge {
  export interface Mixins extends LineMixinVector, FillMixinVector {}

  export interface Attrs extends XYGlyph.Attrs, Mixins {
    direction: Direction
    inner_radius: DistanceSpec
    outer_radius: DistanceSpec
    start_angle: AngleSpec
    end_angle:  AngleSpec
  }

  export interface Props extends XYGlyph.Props {
    direction: p.Direction
    inner_radius: p.DistanceSpec
    outer_radius: p.DistanceSpec
    start_angle: p.AngleSpec
    end_angle: p.AngleSpec
  }

  export interface Visuals extends XYGlyph.Visuals {
    line: Line
    fill: Fill
  }
}

export interface AnnularWedge extends AnnularWedge.Attrs {}

export class AnnularWedge extends XYGlyph {

  properties: AnnularWedge.Props

  constructor(attrs?: Partial<AnnularWedge.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'AnnularWedge';
    this.prototype.default_view = AnnularWedgeView;

    this.mixins(['line', 'fill']);
    this.define({
      direction:    [ p.Direction,   'anticlock' ],
      inner_radius: [ p.DistanceSpec             ],
      outer_radius: [ p.DistanceSpec             ],
      start_angle:  [ p.AngleSpec                ],
      end_angle:    [ p.AngleSpec                ],
    });
  }
}
AnnularWedge.initClass();
