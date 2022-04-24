import {Shape, ShapeView} from "./shape"
import {Coordinate, Node, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import {Decoration} from "../graphics/decoration"
import {Line} from "core/property_mixins"
import {Direction, RadiusDimension, AngleUnits} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {assert} from "core/util/assert"
import {Context2d} from "core/util/canvas"
import {sin, cos, min, max, compute_angle} from "core/util/math"

export class ArcView extends ShapeView {
  override model: Arc
  override visuals: Arc.Visuals

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

  sradius(coord: XY, radius: number): number {
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
    const {center, radius} = this.model
    assert(center instanceof XY)

    const xc = this.x_coordinates(center)
    const yc = this.y_coordinates(center)

    return {
      sx: xc.compute(center.x),
      sy: yc.compute(center.y),
      sradius: this.sradius(center, radius),
      start_angle: this.start_angle,
      end_angle: this.end_angle,
      anticlock: this.anticlock,
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius, start_angle, end_angle, anticlock} = this.geometry

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, start_angle, end_angle, anticlock)

    this.visuals.line.apply(ctx)

    //this.paint_decorations(ctx, sx, sy, sradius, start_angle, end_angle, anticlock)
  }

  protected override _resolve_node(node: Node): Coordinate | null {
    const {sx, sy, sradius, start_angle, end_angle} = this.geometry

    function compute(angle: number) {
      return new XY({
        x: sx + sradius*cos(angle),
        y: sy + sradius*sin(angle),
        x_units: "canvas",
        y_units: "canvas",
      })
    }

    switch (node.term) {
      case "start":
        return compute(start_angle)
      case "end":
        return compute(end_angle)
      default:
        return null
    }
  }

  /*
  protected paint_decorations(ctx: Context2d, sx: number, sy: number, sradius: number,
      start_angle: number, end_angle: number, _anticlock: boolean): void {

    const {sin, cos, PI} = Math

    for (const decoration of this.decorations.values()) {
      ctx.save()

      if (decoration.model.node == "start") {
        const x = sradius*cos(start_angle) + sx
        const y = sradius*sin(start_angle) + sy
        ctx.translate(x, y)
        ctx.rotate(start_angle + PI)
      } else if (decoration.model.node == "end") {
        const x = sradius*cos(end_angle) + sx
        const y = sradius*sin(end_angle) + sy
        ctx.translate(x, y)
        ctx.rotate(end_angle)
      }

      decoration.marking.apply(ctx)
      ctx.restore()
    }
  }
  */
}

export namespace Arc {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    center: p.Property<Coordinate>
    radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
    start_angle: p.Property<number>
    end_angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    decorations: p.Property<Decoration[]>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Arc extends Arc.Attrs {}

export class Arc extends Shape {
  override properties: Arc.Props
  override __view_type__: ArcView

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ArcView

    this.mixins<Arc.Mixins>(Line)

    this.define<Arc.Props>(({Angle, Number, NonNegative, Ref, Array}) => ({
      center:           [ Ref(Coordinate) ],
      radius:           [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Angle ],
      end_angle:        [ Angle ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
      decorations:      [ Array(Ref(Decoration)), [] ],
    }))
  }
}
