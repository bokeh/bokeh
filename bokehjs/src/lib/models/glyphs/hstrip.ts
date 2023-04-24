import {Glyph, GlyphView, GlyphData} from "./glyph"
import {Selection} from "../selections/selection"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {FloatArray, ScreenArray, Rect} from "core/types"
import * as visuals from "core/visuals"
import * as uniforms from "core/uniforms"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {range} from "core/util/array"
import * as p from "core/properties"

const UNUSED = 0

export type HStripData = GlyphData & p.UniformsOf<HStrip.Mixins> & {
  _y0: FloatArray
  _y1: FloatArray

  sy0: ScreenArray
  sy1: ScreenArray

  max_line_width: number
}

export interface HStripView extends HStripData {}

export class HStripView extends GlyphView {
  declare model: HStrip
  declare visuals: HStrip.Visuals

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

  get sleft(): ScreenArray {
    const {left} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sleft = new ScreenArray(n)
    sleft.fill(left)
    return sleft
  }

  get sright(): ScreenArray {
    const {right} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sright = new ScreenArray(n)
    sright.fill(right)
    return sright
  }

  get stop(): ScreenArray {
    return this.sy0
  }

  get sbottom(): ScreenArray {
    return this.sy1
  }

  override after_visuals(): void {
    super.after_visuals()
    this.max_line_width = uniforms.max(this.line_width)
  }

  protected override _index_data(index: SpatialIndex): void {
    const {_y0, _y1, data_size} = this

    for (let i = 0; i < data_size; i++) {
      const y0_i = _y0[i]
      const y1_i = _y1[i]
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
    this.sy0 = map(this.sy0, (yi) => round(yi))
    this.sy1 = map(this.sy1, (yi) => round(yi))
  }

  scenterxy(i: number): [number, number] {
    const {hcenter} = this.renderer.plot_view.frame.bbox
    return [hcenter, (this.sy0[i] + this.sy1[i])/2]
  }

  protected _render(ctx: Context2d, indices: number[], data?: HStripData): void {
    const {sy0, sy1} = data ?? this
    const {left, right, width} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sy0_i = sy0[i]
      const sy1_i = sy1[i]

      if (!isFinite(sy0_i + sy1_i))
        continue

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
    const {max_line_width} = this
    const [y0, y1] = this.renderer.yscale.r_invert(sy0 - max_line_width, (sy1 ?? sy0) + max_line_width)
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
}

export namespace HStrip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    y0: p.CoordinateSpec
    y1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
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
