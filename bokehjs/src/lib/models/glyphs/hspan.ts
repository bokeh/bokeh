import {Glyph, GlyphView} from "./glyph"
import {generic_line_vector_legend} from "./utils"
import {Selection} from "../selections/selection"
import {LineVector} from "core/property_mixins"
import type {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import type {Rect} from "core/types"
import type * as visuals from "core/visuals"
import * as uniforms from "core/uniforms"
import type {Context2d} from "core/util/canvas"
import type {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {range} from "core/util/array"
import * as p from "core/properties"

const {abs, max} = Math

const UNUSED = 0

export interface HSpanView extends HSpan.Data {}

export class HSpanView extends GlyphView {
  declare model: HSpan
  declare visuals: HSpan.Visuals

  override after_visuals(): void {
    super.after_visuals()
    this.max_line_width = uniforms.max(this.line_width)
  }

  protected override _index_data(index: SpatialIndex): void {
    for (const y_i of this.y) {
      index.add_point(UNUSED, y_i)
    }
  }

  protected override _bounds(bounds: Rect): Rect {
    const {y0, y1} = bounds
    return {x0: NaN, x1: NaN, y0, y1}
  }

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    if (!this.inherited_sy) {
      const sy = map(this.sy, (yi) => round(yi))
      this._define_attr("sy", sy)
    }
  }

  scenterxy(i: number): [number, number] {
    const {hcenter} = this.renderer.plot_view.frame.bbox
    return [hcenter, this.sy[i]]
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<HSpan.Data>): void {
    const {sy} = {...this, ...data}
    const {left, right} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sy_i = sy[i]

      if (!isFinite(sy_i)) {
        continue
      }

      ctx.beginPath()
      ctx.moveTo(left, sy_i)
      ctx.lineTo(right, sy_i)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _get_candidates(sy0: number, sy1?: number): Iterable<number> {
    const {max_line_width} = this
    const [y0, y1] = this.renderer.yscale.r_invert(sy0 - max_line_width, (sy1 ?? sy0) + max_line_width)
    return this.index.indices({x0: 0, x1: 0, y0, y1})
  }

  protected _find_spans(candidates: Iterable<number>, fn: (sy: number, line_width: number) => boolean): number[] {
    const {sy, line_width} = this
    const indices: number[] = []

    for (const i of candidates) {
      const sy_i = sy[i]
      const line_width_i = line_width.get(i)
      if (fn(sy_i, line_width_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sy: gsy} = geometry
    const candidates = this._get_candidates(gsy)
    const indices = this._find_spans(candidates, (sy, line_width) => {
      return abs(sy - gsy) <= max(line_width/2, 2/*px*/)
    })
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "v") {
        return range(0, this.data_size)
      } else {
        const {sy: gsy} = geometry
        const candidates = this._get_candidates(gsy)
        return this._find_spans(candidates, (sy, line_width) => {
          return abs(sy - gsy) <= max(line_width/2, 2/*px*/)
        })
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sy0: gsy0, sy1: gsy1} = geometry
      const candidates = this._get_candidates(gsy0, gsy1)
      return this._find_spans(candidates, (sy, line_width) => {
        return gsy0 - line_width/2 <= sy && sy <= gsy1 + line_width/2
      })
    })()
    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace HSpan {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    y: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props> & {
    max_line_width: number
  }
}

export interface HSpan extends HSpan.Attrs {}

export class HSpan extends Glyph {
  declare properties: HSpan.Props
  declare __view_type__: HSpanView

  constructor(attrs?: Partial<HSpan.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HSpanView

    this.mixins<HSpan.Mixins>([LineVector])

    this.define<HSpan.Props>(() => ({
      y: [ p.YCoordinateSpec, {field: "y"} ],
    }))
  }
}
