import {Glyph, GlyphView, GlyphData} from "./glyph"
import {Selection} from "../selections/selection"
import {LineVector} from "core/property_mixins"
import {PointGeometry, SpanGeometry, RectGeometry} from "core/geometry"
import {FloatArray, ScreenArray, Rect} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {range} from "core/util/array"
import * as p from "core/properties"

const {abs} = Math

export type VSpanData = GlyphData & p.UniformsOf<VSpan.Mixins> & {
  _x: FloatArray
  sx: ScreenArray
}

export interface VSpanView extends VSpanData {}

export class VSpanView extends GlyphView {
  declare model: VSpan
  declare visuals: VSpan.Visuals

  protected override _index_data(index: SpatialIndex): void {
    for (const x_i of this._x) {
      index.add_point(x_i, 0)
    }
  }

  protected override _bounds(bounds: Rect): Rect {
    const {x0, x1} = bounds
    return {x0, x1, y0: NaN, y1: NaN}
  }

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    this.sx = map(this.sx, (xi) => round(xi))
  }

  scenterxy(i: number): [number, number] {
    const {vcenter} = this.renderer.plot_view.frame.bbox
    return [this.sx[i], vcenter]
  }

  protected _render(ctx: Context2d, indices: number[], data?: VSpanData): void {
    const {sx} = data ?? this
    const {top, bottom} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sx_i = sx[i]

      if (!isFinite(sx_i))
        continue

      ctx.beginPath()
      ctx.moveTo(sx_i, top)
      ctx.lineTo(sx_i, bottom)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected _find_spans(fn: (sx: number) => boolean): number[] {
    const {sx} = this
    const n = this.data_size
    const indices: number[] = []

    for (let i = 0; i < n; i++) {
      const sx_i = sx[i]
      if (fn(sx_i)) {
        indices.push(i)
      }
    }

    return indices
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx: gsx} = geometry
    const indices = this._find_spans((sx) => abs(sx - gsx) < 2 /*px*/)
    return new Selection({indices})
  }

  protected override _hit_span(geometry: SpanGeometry): Selection {
    const indices = (() => {
      if (geometry.direction == "h") {
        return range(0, this.data_size)
      } else {
        const {sx: gsx} = geometry
        return this._find_spans((sx) => abs(sx - gsx) < 2 /*px*/)
      }
    })()
    return new Selection({indices})
  }

  protected override _hit_rect(geometry: RectGeometry): Selection {
    const indices = (() => {
      const {sx0: gsx0, sx1: gsx1} = geometry
      return this._find_spans((sx) => gsx0 <= sx && sx <= gsx1)
    })()
    return new Selection({indices})
  }
}

export namespace VSpan {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector}
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
