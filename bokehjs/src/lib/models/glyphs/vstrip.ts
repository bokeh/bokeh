import {Glyph, GlyphView} from "./glyph"
import {generic_area_vector_legend} from "./utils"
import {Selection} from "../selections/selection"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import type {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import type {Arrayable, Rect} from "core/types"
import {ScreenArray} from "core/types"
import type * as visuals from "core/visuals"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import * as iter from "core/util/iterator"
import {range} from "core/util/array"
import * as p from "core/properties"
import type {LRTBGL} from "./webgl/lrtb"

const UNUSED = 0

export interface VStripView extends VStrip.Data {}

export class VStripView extends GlyphView {
  declare model: VStrip
  declare visuals: VStrip.Visuals

  /** @internal */
  declare glglyph?: LRTBGL

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()

    const {webgl} = this.renderer.plot_view.canvas_view
    if (webgl != null && webgl.regl_wrapper.has_webgl) {
      const {LRTBGL} = await import("./webgl/lrtb")
      this.glglyph = new LRTBGL(webgl.regl_wrapper, this)
    }
  }

  get sleft(): Arrayable<number> {
    return this.sx0
  }

  get sright(): Arrayable<number> {
    return this.sx1
  }

  get stop(): Arrayable<number> {
    const {top} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const stop = new ScreenArray(n)
    stop.fill(top)
    return stop
  }

  get sbottom(): Arrayable<number> {
    const {bottom} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sbottom = new ScreenArray(n)
    sbottom.fill(bottom)
    return sbottom
  }

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)

    const {abs} = Math
    const {max, map, zip} = iter

    const {x0, x1} = this
    if (this.inherited_x0 && this.inherited_x1) {
      this._inherit_attr("max_width")
    } else {
      const max_width = max(map(zip(x0, x1), ([x0_i, x1_i]) => abs(x0_i - x1_i)))
      this._define_attr("max_width", max_width)
    }
  }

  protected override _index_data(index: SpatialIndex): void {
    const {x0, x1, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const x0_i = x0[i]
      const x1_i = x1[i]
      index.add_rect(x0_i, UNUSED, x1_i, UNUSED)
    }
  }

  protected override _bounds(bounds: Rect): Rect {
    const {x0, x1} = bounds
    return {x0, x1, y0: NaN, y1: NaN}
  }

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    if (!this.inherited_sx0) {
      const sx0 = map(this.sx0, (xi) => round(xi))
      this._define_attr("sx0", sx0)
    }
    if (!this.inherited_sx1) {
      const sx1 = map(this.sx1, (xi) => round(xi))
      this._define_attr("sx1", sx1)
    }
  }

  scenterxy(i: number): [number, number] {
    const {vcenter} = this.renderer.plot_view.frame.bbox
    return [(this.sx0[i] + this.sx1[i])/2, vcenter]
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<VStrip.Data>): void {
    const {sx0, sx1} = {...this, ...data}
    const {top, bottom, height} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sx1_i = sx1[i]

      if (!isFinite(sx0_i + sx1_i)) {
        continue
      }

      ctx.beginPath()
      ctx.rect(sx0_i, top, sx1_i - sx0_i, height)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)

      ctx.beginPath()
      ctx.moveTo(sx0_i, top)
      ctx.lineTo(sx0_i, bottom)
      ctx.moveTo(sx1_i, top)
      ctx.lineTo(sx1_i, bottom)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _get_candidates(sx0: number, sx1?: number): Iterable<number> {
    const {max_width} = this
    const [dx0, dx1] = this.renderer.xscale.r_invert(sx0, sx1 ?? sx0)
    const x0 = dx0 - max_width
    const x1 = dx1 + max_width
    return this.index.indices({x0, x1, y0: 0, y1: 0})
  }

  protected _find_strips(candidates: Iterable<number>, fn: (sx0: number, sx1: number) => boolean): number[] {
    function contains(sx0: number, sx1: number) {
      return sx0 <= sx1 ? fn(sx0, sx1) : fn(sx1, sx0)
    }

    const {sx0, sx1} = this
    const indices: number[] = []

    for (const i of candidates) {
      const sx0_i = sx0[i]
      const sx1_i = sx1[i]
      if (contains(sx0_i, sx1_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx} = geometry
    const candidates = this._get_candidates(sx)
    const indices = this._find_strips(candidates, (sx0, sx1) => sx0 <= sx && sx <= sx1)
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "h") {
        return range(0, this.data_size)
      } else {
        const {sx} = geometry
        const candidates = this._get_candidates(sx)
        return this._find_strips(candidates, (sx0, sx1) => sx0 <= sx && sx <= sx1)
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sx0: gsx0, sx1: gsx1} = geometry
      const candidates = this._get_candidates(gsx0, gsx1)
      return this._find_strips(candidates, (sx0, sx1) => {
        return gsx0 <= sx0 && sx0 <= gsx1 && gsx0 <= sx1 && sx1 <= gsx1
      })
    })()
    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace VStrip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    x1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Props> & {
    max_width: number
  }
}

export interface VStrip extends VStrip.Attrs {}

export class VStrip extends Glyph {
  declare properties: VStrip.Props
  declare __view_type__: VStripView

  constructor(attrs?: Partial<VStrip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VStripView

    this.mixins<VStrip.Mixins>([LineVector, FillVector, HatchVector])

    this.define<VStrip.Props>(() => ({
      x0: [ p.XCoordinateSpec, {field: "x0"} ],
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
    }))
  }
}
