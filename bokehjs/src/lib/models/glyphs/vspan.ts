import {LineVector} from "core/property_mixins"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import * as p from "core/properties"

export type VSpanData = GlyphData & p.UniformsOf<VSpan.Mixins> & {
  _x: FloatArray
  sx: ScreenArray
}

export interface VSpanView extends VSpanData {}

export class VSpanView extends GlyphView {
  declare model: VSpan
  declare visuals: VSpan.Visuals

  override get _index_size(): number {
    return 0
  }

  protected _index_data(_index: SpatialIndex): void {}

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
