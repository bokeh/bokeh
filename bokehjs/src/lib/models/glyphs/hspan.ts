import {LineVector} from "core/property_mixins"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import * as p from "core/properties"

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
