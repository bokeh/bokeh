import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Rect, ScreenArray, to_screen} from "core/types"
import {PointGeometry} from "core/geometry"
import {LineVector, FillVector, HatchVector} from "core/property_mixins"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {Selection} from "../selections/selection"

export type AnnulusData = XYGlyphData & p.UniformsOf<Annulus.Mixins> & {
  readonly inner_radius: p.Uniform<number>
  readonly outer_radius: p.Uniform<number>

  sinner_radius: ScreenArray
  souter_radius: ScreenArray

  readonly max_inner_radius: number
  readonly max_outer_radius: number
}

export interface AnnulusView extends AnnulusData {}

export class AnnulusView extends XYGlyphView {
  declare model: Annulus
  declare visuals: Annulus.Visuals

  /** @internal */
  declare glglyph?: import("./webgl/annulus").AnnulusGL

  override async load_glglyph() {
    const {AnnulusGL} = await import("./webgl/annulus")
    return AnnulusGL
  }

  protected override _map_data(): void {
    if (this.model.properties.inner_radius.units == "data")
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this.inner_radius)
    else
      this.sinner_radius = to_screen(this.inner_radius)

    if (this.model.properties.outer_radius.units == "data")
      this.souter_radius = this.sdist(this.renderer.xscale, this._x, this.outer_radius)
    else
      this.souter_radius = to_screen(this.outer_radius)
  }

  protected _render(ctx: Context2d, indices: number[], data?: AnnulusData): void {
    const {sx, sy, sinner_radius, souter_radius} = data ?? this

    for (const i of indices) {
      const sx_i = sx[i]
      const sy_i = sy[i]
      const sinner_radius_i = sinner_radius[i]
      const souter_radius_i = souter_radius[i]

      if (!isFinite(sx_i + sy_i + sinner_radius_i + souter_radius_i))
        continue

      ctx.beginPath()
      ctx.arc(sx_i, sy_i, sinner_radius_i, 0, 2*Math.PI, true)
      ctx.moveTo(sx_i + souter_radius_i, sy_i)
      ctx.arc(sx_i, sy_i, souter_radius_i, 2*Math.PI, 0, false)

      this.visuals.fill.apply(ctx, i)
      this.visuals.hatch.apply(ctx, i)
      this.visuals.line.apply(ctx, i)
    }
  }

  protected override _hit_point(geometry: PointGeometry): Selection {
    const {sx, sy} = geometry
    const x = this.renderer.xscale.invert(sx)
    const y = this.renderer.yscale.invert(sy)

    let x0: number, y0: number
    let x1: number, y1: number
    if (this.model.properties.outer_radius.units == "data") {
      x0 = x - this.max_outer_radius
      x1 = x + this.max_outer_radius

      y0 = y - this.max_outer_radius
      y1 = y + this.max_outer_radius
    } else {
      const sx0 = sx - this.max_outer_radius
      const sx1 = sx + this.max_outer_radius
      ;[x0, x1] = this.renderer.xscale.r_invert(sx0, sx1)

      const sy0 = sy - this.max_outer_radius
      const sy1 = sy + this.max_outer_radius
      ;[y0, y1] = this.renderer.yscale.r_invert(sy0, sy1)
    }

    const indices: number[] = []
    for (const i of this.index.indices({x0, x1, y0, y1})) {
      const or2 = this.souter_radius[i]**2
      const ir2 = this.sinner_radius[i]**2
      const [sx0, sx1] = this.renderer.xscale.r_compute(x, this._x[i])
      const [sy0, sy1] = this.renderer.yscale.r_compute(y, this._y[i])
      const dist = (sx0 - sx1)**2 + (sy0 - sy1)**2
      if (dist <= or2 && dist >= ir2)
        indices.push(i)
    }

    return new Selection({indices})
  }

  override draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
    const len = index + 1

    const sx: number[] = new Array(len)
    sx[index] = (x0 + x1)/2
    const sy: number[] = new Array(len)
    sy[index] = (y0 + y1)/2

    const r = Math.min(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 0.5

    const sinner_radius: number[] = new Array(len)
    sinner_radius[index] = r*0.4
    const souter_radius: number[] = new Array(len)
    souter_radius[index] = r*0.8

    this._render(ctx, [index], {sx, sy, sinner_radius, souter_radius} as any) // XXX
  }
}

export namespace Annulus {
  export type Attrs = p.AttrsOf<Props>

  export type Props = XYGlyph.Props & {
    inner_radius: p.DistanceSpec
    outer_radius: p.DistanceSpec
  } & Mixins

  export type Mixins = LineVector & FillVector & HatchVector

  export type Visuals = XYGlyph.Visuals & {line: visuals.LineVector, fill: visuals.FillVector, hatch: visuals.HatchVector}
}

export interface Annulus extends Annulus.Attrs {}

export class Annulus extends XYGlyph {
  declare properties: Annulus.Props
  declare __view_type__: AnnulusView

  constructor(attrs?: Partial<Annulus.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnulusView

    this.mixins<Annulus.Mixins>([LineVector, FillVector, HatchVector])

    this.define<Annulus.Props>(({}) => ({
      inner_radius: [ p.DistanceSpec, {field: "inner_radius"} ],
      outer_radius: [ p.DistanceSpec, {field: "outer_radius"} ],
    }))
  }
}
