import {XYGlyph, XYGlyphView, XYGlyphData} from "./xy_glyph"
import {Rect, NumberArray} from "core/types"
import {PointGeometry} from "core/geometry"
import {LineVector, FillVector} from "core/property_mixins"
import {Line, Fill} from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {is_ie} from "core/util/compat"
import {Selection} from "../selections/selection"

export interface AnnulusData extends XYGlyphData {
  _inner_radius: NumberArray
  _outer_radius: NumberArray

  sinner_radius: NumberArray
  souter_radius: NumberArray

  max_inner_radius: number
  max_outer_radius: number
}

export interface AnnulusView extends AnnulusData {}

export class AnnulusView extends XYGlyphView {
  model: Annulus
  visuals: Annulus.Visuals

  protected _map_data(): void {
    if (this.model.properties.inner_radius.units == "data")
      this.sinner_radius = this.sdist(this.renderer.xscale, this._x, this._inner_radius)
    else
      this.sinner_radius = this._inner_radius

    if (this.model.properties.outer_radius.units == "data")
      this.souter_radius = this.sdist(this.renderer.xscale, this._x, this._outer_radius)
    else
      this.souter_radius = this._outer_radius
  }

  protected _render(ctx: Context2d, indices: number[],
                    {sx, sy, sinner_radius, souter_radius}: AnnulusData): void {
    for (const i of indices) {
      if (isNaN(sx[i] + sy[i] + sinner_radius[i] + souter_radius[i]))
        continue

      // Because this visual has a whole in it, it proved "challenging"
      // for some browsers to render if drawn in one go --- i.e. it did not
      // work on IE. If we render in two parts (upper and lower part),
      // it is unambiguous what part should be filled. The line is
      // better drawn in one go though, otherwise the part where the pieces
      // meet will not be fully closed due to aa.

      if (this.visuals.fill.doit) {
        this.visuals.fill.set_vectorize(ctx, i)
        ctx.beginPath()
        if (is_ie) {
          // Draw two halves of the donut. Works on IE, but causes an aa line on Safari.
          for (const clockwise of [false, true]) {
            ctx.arc(sx[i], sy[i], sinner_radius[i], 0, Math.PI, clockwise)
            ctx.arc(sx[i], sy[i], souter_radius[i], Math.PI, 0, !clockwise)
          }
        } else {
          // Draw donut in one go. Does not work on iE.
          ctx.arc(sx[i], sy[i], sinner_radius[i], 0, 2 * Math.PI, true)
          ctx.arc(sx[i], sy[i], souter_radius[i], 2 * Math.PI, 0, false)
        }
        ctx.fill()
      }

      if (this.visuals.line.doit) {
        this.visuals.line.set_vectorize(ctx, i)
        ctx.beginPath()
        ctx.arc(sx[i], sy[i], sinner_radius[i], 0, 2*Math.PI)
        ctx.moveTo(sx[i] + souter_radius[i], sy[i])
        ctx.arc(sx[i], sy[i], souter_radius[i], 0, 2*Math.PI)
        ctx.stroke()
      }
    }
  }

  protected _hit_point(geometry: PointGeometry): Selection {
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

  draw_legend_for_index(ctx: Context2d, {x0, y0, x1, y1}: Rect, index: number): void {
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

  export type Mixins = LineVector & FillVector

  export type Visuals = XYGlyph.Visuals & {line: Line, fill: Fill}
}

export interface Annulus extends Annulus.Attrs {}

export class Annulus extends XYGlyph {
  properties: Annulus.Props
  __view_type__: AnnulusView

  constructor(attrs?: Partial<Annulus.Attrs>) {
    super(attrs)
  }

  static init_Annulus(): void {
    this.prototype.default_view = AnnulusView

    this.mixins<Annulus.Mixins>([LineVector, FillVector])

    this.define<Annulus.Props>({
      inner_radius: [ p.DistanceSpec ],
      outer_radius: [ p.DistanceSpec ],
    })
  }
}
