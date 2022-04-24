import {Shape, ShapeView} from "./shape"
import {Coordinate, Node, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {Context2d} from "core/util/canvas"
import {pi, min, max} from "core/util/math"

type HitTarget = "edge" | "area"

export class CircleView extends ShapeView {
  override model: Circle
  override visuals: Circle.Visuals

  x_coordinates(coord: XY): Scale {
    switch (coord.x_units) {
      case "canvas": return this.canvas.screen.x_scale
      case "screen": return this.parent.view.x_scale
      case "data":   return this.coordinates.x_scale
    }
  }

  y_coordinates(coord: XY): Scale {
    switch (coord.y_units) {
      case "canvas": return this.canvas.screen.y_scale
      case "screen": return this.parent.view.y_scale
      case "data":   return this.coordinates.y_scale
    }
  }

  sradius(coord: XY): number {
    const {radius} = this.model

    const x_scale = this.x_coordinates(coord)
    const y_scale = this.y_coordinates(coord)

    const srx = this.sdist(x_scale, coord.x, radius)
    const sry = this.sdist(y_scale, coord.y, radius)

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
    const center = this.resolve(this.model.center)
    assert(center instanceof XY)
    const sx = this.x_coordinates(center).compute(center.x)
    const sy = this.y_coordinates(center).compute(center.y)
    const sradius = this.sradius(center)
    return {sx, sy, sradius}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius} = this.geometry

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, 0, 2*pi, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }

  protected override _resolve_node(node: Node): Coordinate | null {
    const {sx, sy} = this.geometry

    switch (node.term) {
      case "center":
        return new XY({x: sx, y: sy, x_units: "canvas", y_units: "canvas"})
      default:
        return null
    }
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
    center: p.Property<Coordinate>
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

    this.define<Circle.Props>(({Number, NonNegative, Ref}) => ({
      center:           [ Ref(Coordinate) ],
      radius:           [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
