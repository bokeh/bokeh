import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class CircleView extends ShapeView {
  declare model: Circle
  declare visuals: Circle.Visuals

  get geometry() {
    const {xy, radius, radius_dimension} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const sradius = this.sradius(xy, radius, radius_dimension)
    return {sx, sy, sradius}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius} = this.geometry
    if (!isFinite(sx + sy + sradius)) {
      return
    }

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, 0, 2*Math.PI, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Circle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Circle extends Circle.Attrs {}

export class Circle extends Shape {
  declare properties: Circle.Props
  declare __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([Fill, Hatch, Line])

    this.define<Circle.Props>(({Number, NonNegative, Ref}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      radius: [ NonNegative(Number), 0 ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
