import {Glyph, GlyphView, GlyphData} from "./glyph"
import {Selection} from "../selections/selection"
import {LineVector} from "core/property_mixins"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {range} from "core/util/array"
import * as p from "core/properties"

const {abs} = Math

export type HSpanData = GlyphData & p.UniformsOf<HSpan.Mixins> & {
  _y: FloatArray
  sy: ScreenArray
}

export interface HSpanView extends HSpanData {}

export class HSpanView extends GlyphView {
  declare model: HSpan
  declare visuals: HSpan.Visuals

  override get _index_size(): number {
    return 0
  }

  protected _index_data(_index: SpatialIndex): void {}

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    this.sy = map(this.sy, (yi) => round(yi))
  }

  scenterxy(i: number): [number, number] {
    const {hcenter} = this.renderer.plot_view.frame.bbox
    return [hcenter, this.sy[i]]
  }

  protected _render(ctx: Context2d, indices: number[], data?: HSpanData): void {
    const {sy} = data ?? this
    const {left, right} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sy_i = sy[i]

      if (!isFinite(sy_i))
        continue

      ctx.beginPath()
      ctx.moveTo(left, sy_i)
      ctx.lineTo(right, sy_i)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _find_spans(fn: (sy: number) => boolean): number[] {
    const {sy} = this
    const n = this.data_size
    const indices: number[] = []

    for (let i = 0; i < n; i++) {
      const sy_i = sy[i]
      if (fn(sy_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sy: gsy} = geometry
    const indices = this._find_spans((sy) => abs(sy - gsy) < 2 /*px*/)
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "v") {
        return range(0, this.data_size)
      } else {
        const {sy: gsy} = geometry
        return this._find_spans((sy) => abs(sy - gsy) < 2 /*px*/)
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sy0: gsy0, sy1: gsy1} = geometry
      return this._find_spans((sy) => gsy0 <= sy && sy <= gsy1)
    })()
    return new Selection({indices})
  }
}

export namespace HSpan {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    y: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}
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
