import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class AnnulusView extends ShapeView {
  declare model: Annulus
  declare visuals: Annulus.Visuals

  get geometry() {
    const {xy, inner_radius, outer_radius, radius_dimension} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const sinner_radius = this.sradius(xy, inner_radius, radius_dimension)
    const souter_radius = this.sradius(xy, outer_radius, radius_dimension)
    return {sx, sy, sinner_radius, souter_radius}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sinner_radius, souter_radius} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius)) {
      return
    }

    ctx.beginPath()
    ctx.arc(sx, sy, sinner_radius, 0, 2*Math.PI, true)
    ctx.moveTo(sx + souter_radius, sy)
    ctx.arc(sx, sy, souter_radius, 2*Math.PI, 0, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Annulus {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    inner_radius: p.Property<number>
    outer_radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Annulus extends Annulus.Attrs {}

export class Annulus extends Shape {
  declare properties: Annulus.Props
  declare __view_type__: AnnulusView

  constructor(attrs?: Partial<Annulus.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnulusView

    this.mixins<Annulus.Mixins>([Fill, Hatch, Line])

    this.define<Annulus.Props>(({Number, NonNegative, Ref}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      inner_radius: [ NonNegative(Number), 0 ],
      outer_radius: [ NonNegative(Number), 0 ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
