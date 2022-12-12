import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import * as p from "core/properties"

export type VBandData = GlyphData & p.UniformsOf<VBand.Mixins> & {
  _left: FloatArray
  _right: FloatArray

  sleft: ScreenArray
  sright: ScreenArray
  stop: ScreenArray
  sbottom: ScreenArray
}

export interface VBandView extends VBandData {}

export class VBandView extends GlyphView {
  declare model: VBand
  declare visuals: VBand.Visuals

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

  override get _index_size(): number {
    return 0
  }

  protected _index_data(_index: SpatialIndex): void {}

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    this.sleft = map(this.sleft, (xi) => round(xi))
    this.sright = map(this.sright, (xi) => round(xi))
    const {top, bottom} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    this.stop = new ScreenArray(n)
    this.sbottom = new ScreenArray(n)
    this.stop.fill(top)
    this.sbottom.fill(bottom)
  }

  scenterxy(i: number): [number, number] {
    const {vcenter} = this.renderer.plot_view.frame.bbox
    return [(this.sright[i] - this.sleft[i])/2, vcenter]
  }

  protected _render(ctx: Context2d, indices: number[], data?: VBandData): void {
    const {sleft, sright} = data ?? this
    const {top, bottom, height} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sleft_i = sleft[i]
      const sright_i = sright[i]

      if (!isFinite(sleft_i + sright_i))
        continue

      ctx.beginPath()
      ctx.rect(sleft_i, top, sright_i - sleft_i, height)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)

      ctx.beginPath()
      ctx.moveTo(sleft_i, top)
      ctx.lineTo(sleft_i, bottom)
      ctx.moveTo(sright_i, top)
      ctx.lineTo(sright_i, bottom)

      this.visuals.line.apply(ctx, i)
    }
  }
}

export namespace VBand {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    left: p.CoordinateSpec
    right: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface VBand extends VBand.Attrs {}

export class VBand extends Glyph {
  declare properties: VBand.Props
  declare __view_type__: VBandView

  constructor(attrs?: Partial<VBand.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VBandView

    this.mixins<VBand.Mixins>([LineVector, FillVector, HatchVector])

    this.define<VBand.Props>(() => ({
      left: [ p.XCoordinateSpec, {field: "left"} ],
      right: [ p.XCoordinateSpec, {field: "right"} ],
    }))
  }
}
