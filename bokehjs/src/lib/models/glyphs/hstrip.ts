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

export interface HStripView extends HStrip.Data {}

export class HStripView extends GlyphView {
  declare model: HStrip
  declare visuals: HStrip.Visuals

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
    const {left} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sleft = new ScreenArray(n)
    sleft.fill(left)
    return sleft
  }

  get sright(): Arrayable<number> {
    const {right} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sright = new ScreenArray(n)
    sright.fill(right)
    return sright
  }

  get stop(): Arrayable<number> {
    return this.sy0
  }

  get sbottom(): Arrayable<number> {
    return this.sy1
  }

  protected override _set_data(indices: number[] | null): void {
    super._set_data(indices)

    const {abs} = Math
    const {max, map, zip} = iter

    const {y0, y1} = this
    if (this.inherited_y0 && this.inherited_y1) {
      this._inherit_attr("max_height")
    } else {
      const max_height = max(map(zip(y0, y1), ([y0_i, y1_i]) => abs(y0_i - y1_i)))
      this._define_attr("max_height", max_height)
    }
  }

  protected override _index_data(index: SpatialIndex): void {
    const {y0, y1, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const y0_i = y0[i]
      const y1_i = y1[i]
      index.add_rect(UNUSED, y0_i, UNUSED, y1_i)
    }
  }

  protected override _bounds(bounds: Rect): Rect {
    const {y0, y1} = bounds
    return {x0: NaN, x1: NaN, y0, y1}
  }

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    if (!this.inherited_sy0) {
      const sy0 = map(this.sy0, (yi) => round(yi))
      this._define_attr("sy0", sy0)
    }
    if (!this.inherited_sy1) {
      const sy1 = map(this.sy1, (yi) => round(yi))
      this._define_attr("sy1", sy1)
    }
  }

  scenterxy(i: number): [number, number] {
    const {hcenter} = this.renderer.plot_view.frame.bbox
    return [hcenter, (this.sy0[i] + this.sy1[i])/2]
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<HStrip.Data>): void {
    const {sy0, sy1} = {...this, ...data}
    const {left, right, width} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sy0_i = sy0[i]
      const sy1_i = sy1[i]

      if (!isFinite(sy0_i + sy1_i)) {
        continue
      }

      ctx.beginPath()
      ctx.rect(left, sy0_i, width, sy1_i - sy0_i)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)

      ctx.beginPath()
      ctx.moveTo(left, sy0_i)
      ctx.lineTo(right, sy0_i)
      ctx.moveTo(left, sy1_i)
      ctx.lineTo(right, sy1_i)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _get_candidates(sy0: number, sy1?: number): Iterable<number> {
    const {max_height} = this
    const [dy0, dy1] = this.renderer.yscale.r_invert(sy0, sy1 ?? sy0)
    const y0 = dy0 - max_height
    const y1 = dy1 + max_height
    return this.index.indices({x0: 0, x1: 0, y0, y1})
  }

  protected _find_strips(candidates: Iterable<number>, fn: (sy0: number, sy1: number) => boolean): number[] {
    function contains(sy0: number, sy1: number) {
      return sy0 <= sy1 ? fn(sy0, sy1) : fn(sy1, sy0)
    }

    const {sy0, sy1} = this
    const indices: number[] = []

    for (const i of candidates) {
      const sy0_i = sy0[i]
      const sy1_i = sy1[i]
      if (contains(sy0_i, sy1_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sy} = geometry
    const candidates = this._get_candidates(sy)
    const indices = this._find_strips(candidates, (sy0, sy1) => sy0 <= sy && sy <= sy1)
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "v") {
        return range(0, this.data_size)
      } else {
        const {sy} = geometry
        const candidates = this._get_candidates(sy)
        return this._find_strips(candidates, (sy0, sy1) => sy0 <= sy && sy <= sy1)
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sy0: gsy0, sy1: gsy1} = geometry
      const candidates = this._get_candidates(gsy0, gsy1)
      return this._find_strips(candidates, (sy0, sy1) => {
        return gsy0 <= sy0 && sy0 <= gsy1 && gsy0 <= sy1 && sy1 <= gsy1
      })
    })()
    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_area_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace HStrip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    y0: p.CoordinateSpec
    y1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}

  export type Data = p.GlyphDataOf<Props> & {
    max_height: number
  }
}

export interface HStrip extends HStrip.Attrs {}

export class HStrip extends Glyph {
  declare properties: HStrip.Props
  declare __view_type__: HStripView

  constructor(attrs?: Partial<HStrip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HStripView

    this.mixins<HStrip.Mixins>([LineVector, FillVector, HatchVector])

    this.define<HStrip.Props>(() => ({
      y0: [ p.YCoordinateSpec, {field: "y0"} ],
      y1: [ p.YCoordinateSpec, {field: "y1"} ],
    }))
  }
}
