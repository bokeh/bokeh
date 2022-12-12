import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import {Glyph, GlyphView, GlyphData} from "./glyph"
import * as p from "core/properties"

export type HBandData = GlyphData & p.UniformsOf<HBand.Mixins> & {
  _top: FloatArray
  _bottom: FloatArray

  sleft: ScreenArray
  sright: ScreenArray
  stop: ScreenArray
  sbottom: ScreenArray
}

export interface HBandView extends HBandData {}

export class HBandView extends GlyphView {
  declare model: HBand
  declare visuals: HBand.Visuals

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
    const {left, right} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    this.sleft = new ScreenArray(n)
    this.sright = new ScreenArray(n)
    this.sleft.fill(left)
    this.sright.fill(right)
    this.stop = map(this.stop, (yi) => round(yi))
    this.sbottom = map(this.sbottom, (yi) => round(yi))
  }

  scenterxy(i: number): [number, number] {
    const {hcenter} = this.renderer.plot_view.frame.bbox
    return [hcenter, (this.sbottom[i] - this.stop[i])/2]
  }

  protected _render(ctx: Context2d, indices: number[], data?: HBandData): void {
    const {stop, sbottom} = data ?? this
    const {left, right, width} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const stop_i = stop[i]
      const sbottom_i = sbottom[i]

      if (!isFinite(stop_i + sbottom_i))
        continue

      ctx.beginPath()
      ctx.rect(left, stop_i, width, sbottom_i - stop_i)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)

      ctx.beginPath()
      ctx.moveTo(left, stop_i)
      ctx.lineTo(right, stop_i)
      ctx.moveTo(left, sbottom_i)
      ctx.lineTo(right, sbottom_i)

      this.visuals.line.apply(ctx, i)
    }
  }
}

export namespace HBand {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    top: p.CoordinateSpec
    bottom: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface HBand extends HBand.Attrs {}

export class HBand extends Glyph {
  declare properties: HBand.Props
  declare __view_type__: HBandView

  constructor(attrs?: Partial<HBand.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = HBandView

    this.mixins<HBand.Mixins>([LineVector, FillVector, HatchVector])

    this.define<HBand.Props>(() => ({
      top: [ p.YCoordinateSpec, {field: "top"} ],
      bottom: [ p.YCoordinateSpec, {field: "bottom"} ],
    }))
  }
}
