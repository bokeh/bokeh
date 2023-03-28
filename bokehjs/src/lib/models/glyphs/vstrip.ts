import {Glyph, GlyphView, GlyphData} from "./glyph"
import {Selection} from "../selections/selection"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import {PointGeometry/*, SpanGeometry, RectGeometry*/} from "core/geometry"
import {FloatArray, ScreenArray} from "core/types"
import * as visuals from "core/visuals"
import {Context2d} from "core/util/canvas"
import {SpatialIndex} from "core/util/spatial"
import {map} from "core/util/arrayable"
import * as p from "core/properties"

export type VStripData = GlyphData & p.UniformsOf<VStrip.Mixins> & {
  _x0: FloatArray
  _x1: FloatArray

  sx0: ScreenArray
  sx1: ScreenArray
}

export interface VStripView extends VStripData {}

export class VStripView extends GlyphView {
  declare model: VStrip
  declare visuals: VStrip.Visuals

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
    return this.sx0
  }

  get sright(): ScreenArray {
    return this.sx1
  }

  get stop(): ScreenArray {
    const {top} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const stop = new ScreenArray(n)
    stop.fill(top)
    return stop
  }

  get sbottom(): ScreenArray {
    const {bottom} = this.renderer.plot_view.frame.bbox
    const n = this.data_size
    const sbottom = new ScreenArray(n)
    sbottom.fill(bottom)
    return sbottom
  }

  override get _index_size(): number {
    return 0
  }

  protected _index_data(_index: SpatialIndex): void {}

  protected override _map_data(): void {
    super._map_data()
    const {round} = Math
    this.sx0 = map(this.sx0, (xi) => round(xi))
    this.sx1 = map(this.sx1, (xi) => round(xi))
  }

  scenterxy(i: number): [number, number] {
    const {vcenter} = this.renderer.plot_view.frame.bbox
    return [(this.sx0[i] + this.sx1[i])/2, vcenter]
  }

  protected _render(ctx: Context2d, indices: number[], data?: VStripData): void {
    const {sx0, sx1} = data ?? this
    const {top, bottom, height} = this.renderer.plot_view.frame.bbox

    for (const i of indices) {
      const sx0_i = sx0[i]
      const sx1_i = sx1[i]

      if (!isFinite(sx0_i + sx1_i))
        continue

      ctx.beginPath()
      ctx.rect(sx0_i, top, sx1_i - sx0_i, height)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)

      ctx.beginPath()
      ctx.moveTo(sx0_i, top)
      ctx.lineTo(sx0_i, bottom)
      ctx.moveTo(sx1_i, top)
      ctx.lineTo(sx1_i, bottom)

      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx} = geometry

    function contains(sx0: number, sx1: number) {
      if (sx0 <= sx1)
        return sx0 <= sx && sx <= sx1
      else
        return sx1 <= sx && sx <= sx0
    }

    const {sx0, sx1} = this
    const n = this.data_size
    const indices: number[] = []

    for (let i = 0; i < n; i++) {
      const sx0_i = sx0[i]
      const sx1_i = sx1[i]
      if (contains(sx0_i, sx1_i)) {
        indices.push(i)
      }
    }

    return new Selection({indices})
  }
}

export namespace VStrip {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Glyph.Props & {
    x0: p.CoordinateSpec
    x1: p.CoordinateSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = Glyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface VStrip extends VStrip.Attrs {}

export class VStrip extends Glyph {
  declare properties: VStrip.Props
  declare __view_type__: VStripView

  constructor(attrs?: Partial<VStrip.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = VStripView

    this.mixins<VStrip.Mixins>([LineVector, FillVector, HatchVector])

    this.define<VStrip.Props>(() => ({
      x0: [ p.XCoordinateSpec, {field: "x0"} ],
      x1: [ p.XCoordinateSpec, {field: "x1"} ],
    }))
  }
}
