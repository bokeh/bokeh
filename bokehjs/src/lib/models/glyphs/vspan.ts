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

export interface VSpanView extends VSpan.Data {}

export class VSpanView extends GlyphView {
  declare model: VSpan
  declare visuals: VSpan.Visuals

  override after_visuals(): void {
    super.after_visuals()
    this.max_line_width = uniforms.max(this.line_width)
  }

  protected override _index_data(index: SpatialIndex): void {
    for (const x_i of this.x) {
      index.add_point(x_i, UNUSED)
    }
  }

  protected override _bounds(bounds: Rect): Rect {
    const {x0, x1} = bounds
    return {x0, x1, y0: NaN, y1: NaN}
  }

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    if (!this.inherited_sx) {
      const sx = map(this.sx, (xi) => round(xi))
      this._define_attr("sx", sx)
    }
  }

  scenterxy(i: number): [number, number] {
    const {vcenter} = this.renderer.plot_view.frame.bbox
    return [this.sx[i], vcenter]
  }

  protected _paint(ctx: Context2d, indices: number[], data?: Partial<VSpan.Data>): void {
    const {sx} = {...this, ...data}
    const {top, bottom} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sx_i = sx[i]

      if (!isFinite(sx_i)) {
        continue
      }

      ctx.beginPath()
      ctx.moveTo(sx_i, top)
      ctx.lineTo(sx_i, bottom)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _get_candidates(sx0: number, sx1?: number): Iterable<number> {
    const {max_line_width} = this
    const [x0, x1] = this.renderer.xscale.r_invert(sx0 - max_line_width, (sx1 ?? sx0) + max_line_width)
    return this.index.indices({x0, x1, y0: 0, y1: 0})
  }

  protected _find_spans(candidates: Iterable<number>, fn: (sx: number, line_width: number) => boolean): number[] {
    const {sx, line_width} = this
    const indices: number[] = []

    for (const i of candidates) {
      const sx_i = sx[i]
      const line_width_i = line_width.get(i)
      if (fn(sx_i, line_width_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx: gsx} = geometry
    const candidates = this._get_candidates(gsx)
    const indices = this._find_spans(candidates, (sx, line_width) => {
      return abs(sx - gsx) <= max(line_width, 2/*px*/)
    })
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "h") {
        return range(0, this.data_size)
      } else {
        const {sx: gsx} = geometry
        const candidates = this._get_candidates(gsx)
        return this._find_spans(candidates, (sx, line_width) => {
          return abs(sx - gsx) <= max(line_width/2, 2/*px*/)
        })
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sx0: gsx0, sx1: gsx1} = geometry
      const candidates = this._get_candidates(gsx0, gsx1)
      return this._find_spans(candidates, (sx, line_width) => {
        return gsx0 - line_width/2 <= sx && sx <= gsx1 + line_width/2
      })
    })()
    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, bbox: Rect, index: number): void {
    generic_line_vector_legend(this.visuals, ctx, bbox, index)
  }
}

export namespace VSpan {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}

  export type Data = p.GlyphDataOf<Props> & {
    max_line_width: number
  }
}

export interface VSpan extends VSpan.Attrs {}

export class VSpan extends Glyph {
  declare properties: VSpan.Props
  declare __view_type__: VSpanView

  constructor(attrs?: Partial<VSpan.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VSpanView

    this.mixins<VSpan.Mixins>([LineVector])

    this.define<VSpan.Props>(() => ({
      x: [ p.XCoordinateSpec, {field: "x"} ],
    }))
  }
}
