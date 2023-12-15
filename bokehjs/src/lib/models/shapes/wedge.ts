import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, Direction, RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {compute_angle} from "core/util/math"

export class WedgeView extends ShapeView {
  declare model: Wedge
  declare visuals: Wedge.Visuals

  get start_angle(): number {
    return compute_angle(this.model.start_angle, this.model.angle_units)
  }

  get end_angle(): number {
    return compute_angle(this.model.end_angle, this.model.angle_units)
  }

  get anticlock(): boolean {
    return this.model.direction == "anticlock"
  }

  get geometry() {
    const {xy, radius, radius_dimension} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const sradius = this.sradius(xy, radius, radius_dimension)
    const {start_angle, end_angle, anticlock} = this
    return {sx, sy, sradius, start_angle, end_angle, anticlock}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius, start_angle, end_angle, anticlock} = this.geometry
    if (!isFinite(sx + sy + sradius + start_angle + end_angle)) {
      return
    }

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, start_angle, end_angle, anticlock)
    ctx.lineTo(sx, sy)
    ctx.closePath()

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Wedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
    start_angle: p.Property<number>
    end_angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Wedge extends Wedge.Attrs {}

export class Wedge extends Shape {
  declare properties: Wedge.Props
  declare __view_type__: WedgeView

  constructor(attrs?: Partial<Wedge.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WedgeView

    this.mixins<Wedge.Mixins>([Fill, Hatch, Line])

    this.define<Wedge.Props>(({Number, NonNegative, Ref}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      radius: [ NonNegative(Number), 0 ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle: [ Number, 0 ],
      end_angle: [ Number, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction: [ Direction, "anticlock" ],
    }))
  }
}
