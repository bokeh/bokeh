import {Shape, ShapeView} from "./shape"
import {Scale} from "../scales/scale"
import {Decoration} from "../graphics/decoration"
import {Line} from "core/property_mixins"
import {Direction, RadiusDimension, CoordinateUnits, AngleUnits} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import {Context2d} from "core/util/canvas"
import {min, max, compute_angle} from "core/util/math"

export class ArcView extends ShapeView {
  override model: Arc
  override visuals: Arc.Visuals

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

    if (!this.visuals.line.apply(ctx))
      return

    //this.paint_decorations(ctx, sx, sy, sradius, start_angle, end_angle, anticlock)
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
        const x = sradius*Math.cos(end_angle) + sx
        const y = sradius*Math.sin(end_angle) + sy
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
      x:                [ Number ],
      y:                [ Number ],
      x_units:          [ CoordinateUnits, "data" ],
      y_units:          [ CoordinateUnits, "data" ],
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
