import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {Rect, FloatArray, ScreenArray} from "core/types"
import {Anchor} from "core/enums"
import * as visuals from "core/visuals"
import {SpatialIndex} from "core/util/spatial"
import {Context2d} from "core/util/canvas"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {Selection} from "../selections/selection"
import * as p from "core/properties"
import {BBox, Corners} from "core/util/bbox"
import {BorderRadius} from "../common/kinds"
import * as resolve from "../common/resolve"
import {round_rect} from "../common/painting"

// This class is intended to be a private implementation detail that can
// be re-used by various rect, bar, box, quad, etc. glyphs.

export type LRTBData = GlyphData & p.UniformsOf<LRTB.Mixins> & {
  _right: FloatArray
  _bottom: FloatArray
  _left: FloatArray
  _top: FloatArray

  sright: ScreenArray
  sbottom: ScreenArray
  sleft: ScreenArray
  stop: ScreenArray

  border_radius: Corners<number>
}

export interface LRTBView extends LRTBData {}

export abstract class LRTBView extends GlyphView {
  declare model: LRTB
  declare visuals: LRTB.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/lrtb").LRTBGL

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null && webgl.regl_wrapper.has_webgl) {
      const {LRTBGL} = await import("./webgl/lrtb")
      this.glglyph = new LRTBGL(webgl.regl_wrapper, this)
    }
  }

  override get_anchor_point(anchor: Anchor, i: number, _spt: [number, number]): {x: number, y: number} | null {
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

  protected abstract _lrtb(i: number): [number, number, number, number]

  protected _index_data(index: SpatialIndex): void {
    const {min, max} = Math
    const {data_size} = this

    for (let i = 0; i < data_size; i++) {
      const [l, r, t, b] = this._lrtb(i)
      index.add_rect(min(l, r), min(t, b), max(r, l), max(t, b))
    }
  }

  protected _render(ctx: Context2d, indices: number[], data?: LRTBData): void {
    const {sleft, sright, stop, sbottom, border_radius} = data ?? this

    for (const i of indices) {
      const sleft_i = sleft[i]
      const stop_i = stop[i]
      const sright_i = sright[i]
      const sbottom_i = sbottom[i]

      if (!isFinite(sleft_i + stop_i + sright_i + sbottom_i))
        continue

      ctx.beginPath()
      const box = BBox.from_lrtb({left: sleft_i, right: sright_i, top: stop_i, bottom: sbottom_i})
      round_rect(ctx, box, border_radius)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  // We need to clamp the endpoints inside the viewport, because various browser canvas
  // implementations have issues drawing rects with enpoints far outside the viewport
  protected _clamp_viewport(): void {
    const hr = this.renderer.plot_view.frame.bbox.h_range
    const vr = this.renderer.plot_view.frame.bbox.v_range
    const n = this.stop.length
    for (let i = 0; i < n; i++) {
      this.stop[i] = Math.max(this.stop[i], vr.start)
      this.sbottom[i] = Math.min(this.sbottom[i], vr.end)
      this.sleft[i] = Math.max(this.sleft[i], hr.start)
      this.sright[i] = Math.min(this.sright[i], hr.end)
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
