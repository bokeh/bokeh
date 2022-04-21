import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension, CoordinateUnits} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {min, max} from "core/util/math"

type HitTarget = "edge" | "area"

export class CircleView extends ShapeView {
  override model: Circle
  override visuals: Circle.Visuals

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

  get geometry(): {sx: number, sy: number, sradius: number} {
    const sx = this.x_coordinates.compute(this.model.x)
    const sy = this.y_coordinates.compute(this.model.y)
    const {sradius} = this
    return {sx, sy, sradius}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius} = this.geometry
    if (!isFinite(sx + sy + sradius))
      return

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, 0, 2*Math.PI, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }

  _hit_test(csx: number, csy: number): HitTarget | null {
    const {sx, sy, sradius} = this.geometry
    const r2 = (sradius/**hit_dilation*/)**2
    const dist = (sx - csx)**2 + (sy - csy)**2

    //const tolerance = Math.max(EDGE_TOLERANCE, this.model.line_width/2)

    if (dist <= r2) {
      return "area"
    }

    return null
  }
}

export namespace Circle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
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
  override properties: Circle.Props
  override __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([Fill, Hatch, Line])

    this.define<Circle.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      x_units:          [ CoordinateUnits, "data" ],
      y_units:          [ CoordinateUnits, "data" ],
      radius:           [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
