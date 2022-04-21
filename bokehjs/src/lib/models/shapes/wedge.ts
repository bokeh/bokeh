import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, CoordinateUnits, Direction, RadiusDimension} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {min, max, compute_angle} from "core/util/math"

export class WedgeView extends ShapeView {
  override model: Wedge
  override visuals: Wedge.Visuals

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

  get sradius(): number {
    const x_scale = this.x_coordinates
    const y_scale = this.y_coordinates

    const srx = this.sdist(x_scale, this.model.x, this.model.radius)
    const sry = this.sdist(y_scale, this.model.y, this.model.radius)

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
      sradius: this.sradius,
      start_angle: this.start_angle,
      end_angle: this.end_angle,
      anticlock: this.anticlock,
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius, start_angle, end_angle, anticlock} = this.geometry
    if (!isFinite(sx + sy + sradius + start_angle + end_angle))
      return

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
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
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
  override properties: Wedge.Props
  override __view_type__: WedgeView

  constructor(attrs?: Partial<Wedge.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = WedgeView

    this.mixins<Wedge.Mixins>([Fill, Hatch, Line])

    this.define<Wedge.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      x_units:          [ CoordinateUnits, "data" ],
      y_units:          [ CoordinateUnits, "data" ],
      radius:           [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Number ],
      end_angle:        [ Number ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
    }))
  }
}
