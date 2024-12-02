import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type {Rect} from "core/types"
import type {Anchor} from "core/enums"
import type * as visuals from "core/visuals"
import type {SpatialIndex} from "core/util/spatial"
import type {Context2d} from "core/util/canvas"
import {Glyph, GlyphView} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import type {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {Selection} from "../selections/selection"
import type * as p from "core/properties"
import type {Corners} from "core/util/bbox"
import type {XY} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {inplace_map} from "core/util/arrayable"
import {BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"
import type {LRTBGL} from "./webgl/lrtb"

// This class is intended to be a private implementation detail that can
// be re-used by various rect, bar, box, quad, etc. glyphs.

export type LRTBRect = {l: number, r: number, t: number, b: number}

export interface LRTBView extends LRTB.Data {}

export abstract class LRTBView extends GlyphView {
  declare model: LRTB
  declare visuals: LRTB.Visuals

  /** @internal */
  declare glglyph?: LRTBGL

  override async load_glglyph() {
    const {LRTBGL} = await import("./webgl/lrtb")
    return LRTBGL
  }

  override get_anchor_point(anchor: Anchor, i: number, _spt: [number, number]): XY | null {
    const left = Math.min(this.sleft[i], this.sright[i])
    const right = Math.max(this.sright[i], this.sleft[i])
    const top = Math.min(this.stop[i], this.sbottom[i])     // screen coordinates !!!
    const bottom = Math.max(this.sbottom[i], this.stop[i])  //

    switch (anchor) {
      case "top_left":      return {x: left,             y: top}
      case "top":
      case "top_center":    return {x: (left + right)/2, y: top}
      case "top_right":     return {x: right,            y: top}
      case "bottom_left":   return {x: left,             y: bottom}
      case "bottom":
      case "bottom_center": return {x: (left + right)/2, y: bottom}
      case "bottom_right":  return {x: right,            y: bottom}
      case "left":
      case "center_left":   return {x: left,             y: (top + bottom)/2}
      case "center":
      case "center_center": return {x: (left + right)/2, y: (top + bottom)/2}
      case "right":
      case "center_right":  return {x: right,            y: (top + bottom)/2}
    }
  }

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)
    this.border_radius = resolve.border_radius(this.model.border_radius)
  }

  protected abstract _lrtb(i: number): LRTBRect

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const {l, r, t, b} = this._lrtb(i)
      index.add_rect(min(l, r), min(t, b), max(r, l), max(t, b))
    }
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<LRTB.Data>): void {
    const {sleft, sright, stop, sbottom, border_radius} = {...this, ...data}

    for (const i of indices) {
      const sleft_i = sleft[i]
      const stop_i = stop[i]
      const sright_i = sright[i]
      const sbottom_i = sbottom[i]

      if (!isFinite(sleft_i + stop_i + sright_i + sbottom_i)) {
        continue
      }

      ctx.beginPath()
      const box = BBox.from_lrtb({left: sleft_i, right: sright_i, top: stop_i, bottom: sbottom_i})
      round_rect(ctx, box, border_radius)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  // We need to clamp the endpoints inside the viewport, because various browser canvas
  // implementations have issues drawing rects with endpoints far outside the viewport
  protected _clamp_to_viewport(): void {
    const {min, max} = Math
    const {h_range, v_range} = this.renderer.plot_view.frame.bbox

    if (!this.inherited_sleft) {
      inplace_map(this.sleft, (left) => max(left, h_range.start))
    }
    if (!this.inherited_sright) {
      inplace_map(this.sright, (right) => min(right, h_range.end))
    }
    if (!this.inherited_stop) {
      inplace_map(this.stop, (top) => max(top, v_range.start))
    }
    if (!this.inherited_sbottom) {
      inplace_map(this.sbottom, (bottom) => min(bottom, v_range.end))
    }
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    return this._hit_rect_against_index(geometry)
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    const indices = [...this.index.indices({x0: x, y0: y, x1: x, y1: y})]
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const {sx, sy} = geometry

    let indices: number[]
    if (geometry.direction == "v") {
      const y = this.renderer.yscale.invert(sy)
      const hr = this.renderer.plot_view.frame.bbox.h_range
      const [x0, x1] = this.renderer.xscale.r_invert(hr.start, hr.end)
      indices = [...this.index.indices({x0, y0: y, x1, y1: y})]
    } else {
      const x = this.renderer.xscale.invert(sx)
      const vr = this.renderer.plot_view.frame.bbox.v_range
      const [y0, y1] = this.renderer.yscale.r_invert(vr.start, vr.end)
      indices = [...this.index.indices({x0: x, y0, x1: x, y1})]
    }

    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace LRTB {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    border_radius: p.Property<BorderRadius>
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Props & {
    readonly left: p.XCoordinateSpec
    readonly right: p.XCoordinateSpec
    readonly top: p.YCoordinateSpec
    readonly bottom: p.YCoordinateSpec
  }> & {
    border_radius: Corners<number>
  }
}

export interface LRTB extends LRTB.Attrs {}

export abstract class LRTB extends Glyph {
  declare properties: LRTB.Props
  declare __view_type__: LRTBView

  constructor(attrs?: Partial<LRTB.Attrs>) {
    super(attrs)
  }

  static {
    this.mixins<LRTB.Mixins>([LineVector, FillVector, HatchVector])

    this.define<LRTB.Props>(() => ({
      border_radius: [ BorderRadius, 0 ],
    }))
  }
}
