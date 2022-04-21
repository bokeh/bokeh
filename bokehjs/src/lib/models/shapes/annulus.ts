import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Fill, Hatch, Line} from "core/property_mixins"
import {CoordinateUnits, RadiusDimension} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {min, max} from "core/util/math"

export class AnnulusView extends ShapeView {
  override model: Annulus
  override visuals: Annulus.Visuals

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

  get geometry() {
    return {
      sx: this.x_coordinates.compute(this.model.x),
      sy: this.y_coordinates.compute(this.model.y),
      sinner_radius: this.sradius(this.model.inner_radius),
      souter_radius: this.sradius(this.model.outer_radius),
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sinner_radius, souter_radius} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius))
      return

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
    x: p.Property<number>
    y: p.Property<number>
    x_units: p.Property<CoordinateUnits>
    y_units: p.Property<CoordinateUnits>
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
  override properties: Annulus.Props
  override __view_type__: AnnulusView

  constructor(attrs?: Partial<Annulus.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnulusView

    this.mixins<Annulus.Mixins>([Fill, Hatch, Line])

    this.define<Annulus.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      x_units:          [ CoordinateUnits, "data" ],
      y_units:          [ CoordinateUnits, "data" ],
      inner_radius:     [ NonNegative(Number) ],
      outer_radius:     [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
