import {Shape, ShapeView} from "./shape"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, Direction, RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {compute_angle} from "core/util/math"

export class AnnularWedgeView extends ShapeView {
  declare model: AnnularWedge
  declare visuals: AnnularWedge.Visuals

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
    const {xy, inner_radius, outer_radius, radius_dimension} = this.model
    const {sx, sy} = this.compute_coord(xy)
    const sinner_radius = this.sradius(xy, inner_radius, radius_dimension)
    const souter_radius = this.sradius(xy, outer_radius, radius_dimension)
    const {start_angle, end_angle, anticlock} = this
    return {sx, sy, sinner_radius, souter_radius, start_angle, end_angle, anticlock}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, start_angle, end_angle, sinner_radius, souter_radius, anticlock} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius + start_angle + end_angle)) {
      return
    }

    const angle = end_angle - start_angle

    ctx.translate(sx, sy)
    ctx.rotate(start_angle)

    ctx.beginPath()
    ctx.moveTo(souter_radius, 0)
    ctx.arc(0, 0, souter_radius, 0, angle, anticlock)
    ctx.rotate(angle)
    ctx.lineTo(sinner_radius, 0)
    ctx.arc(0, 0, sinner_radius, 0, -angle, !anticlock)
    ctx.closePath()

    ctx.rotate(-angle - start_angle)
    ctx.translate(-sx, -sy)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace AnnularWedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
    inner_radius: p.Property<number>
    outer_radius: p.Property<number>
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

export interface AnnularWedge extends AnnularWedge.Attrs {}

export class AnnularWedge extends Shape {
  declare properties: AnnularWedge.Props
  declare __view_type__: AnnularWedgeView

  constructor(attrs?: Partial<AnnularWedge.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnularWedgeView

    this.mixins<AnnularWedge.Mixins>([Fill, Hatch, Line])

    this.define<AnnularWedge.Props>(({Number, NonNegative, Ref}) => ({
      xy: [ Ref(Coordinate), () => new XY() ],
      inner_radius: [ NonNegative(Number), 0 ],
      outer_radius: [ NonNegative(Number), 0 ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle: [ Number, 0 ],
      end_angle: [ Number, 0 ],
      angle_units: [ AngleUnits, "rad" ],
      direction: [ Direction, "anticlock" ],
    }))
  }
}
