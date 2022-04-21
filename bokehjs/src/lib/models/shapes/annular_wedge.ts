import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, CoordinateUnits, Direction, RadiusDimension} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {min, max, compute_angle} from "core/util/math"

type HitTarget = "outer_edge" | "inner_edge" | "area"

export class AnnularWedgeView extends ShapeView {
  override model: AnnularWedge
  override visuals: AnnularWedge.Visuals

  get x_coordinates(): Scale {
    switch (this.model.x_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  get y_coordinates(): Scale {
    switch (this.model.y_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  sradius(radius: number): number {
    const x_scale = this.x_coordinates
    const y_scale = this.y_coordinates

    const srx = this.sdist(x_scale, this.model.x, radius)
    const sry = this.sdist(y_scale, this.model.y, radius)

    const sradius = (() => {
      switch (this.model.radius_dimension) {
        case "x":   return srx
        case "y":   return sry
        case "min": return min(srx, sry)
        case "max": return max(srx, sry)
      }
    })()

    return sradius
  }

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
    return {
      sx: this.x_coordinates.compute(this.model.x),
      sy: this.y_coordinates.compute(this.model.y),
      sinner_radius: this.sradius(this.model.inner_radius),
      souter_radius: this.sradius(this.model.outer_radius),
      start_angle: this.start_angle,
      end_angle: this.end_angle,
      anticlock: this.anticlock,
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, start_angle, end_angle, sinner_radius, souter_radius, anticlock} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius + start_angle + end_angle))
      return

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
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
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
  override properties: AnnularWedge.Props
  override __view_type__: AnnularWedgeView

  constructor(attrs?: Partial<AnnularWedge.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnularWedgeView

    this.mixins<AnnularWedge.Mixins>([Fill, Hatch, Line])

    this.define<AnnularWedge.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      x_units:          [ CoordinateUnits, "data" ],
      y_units:          [ CoordinateUnits, "data" ],
      inner_radius:     [ NonNegative(Number) ],
      outer_radius:     [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Number ],
      end_angle:        [ Number ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
    }))
  }
}
