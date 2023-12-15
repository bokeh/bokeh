import {Shape, ShapeView} from "./shape"
import {Decoration} from "./common"
import {ArrowHeadView} from "./arrow_heads"
import {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import {Line} from "core/property_mixins"
import {Direction, RadiusDimension, AngleUnits} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {compute_angle, to_cartesian} from "core/util/math"

export class ArcView extends ShapeView {
  declare model: Arc
  declare visuals: Arc.Visuals

  override get sub_renderers() {
    return [...super.sub_renderers, ...this.model.decorations.map(({marker}) => marker)]
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

    if (!this.visuals.line.apply(ctx)) {
      return
    }

    for (const decoration of this.model.decorations) {
      const marker_view = this._sub_renderers.get(decoration.marker)
      if (!(marker_view instanceof ArrowHeadView)) {
        continue
      }

      const [angle, rotation] = (() => {
        switch (decoration.node) {
          case "start":  return [start_angle, Math.PI]
          case "middle": return [(start_angle + end_angle)/2, Math.PI]
          case "end":    return [end_angle, 0]
        }
      })()

      const [x, y] = (() => {
        const [x, y] = to_cartesian(sradius, angle)
        return [x + sx, y + sy]
      })()

      ctx.translate(x, y)
      ctx.rotate(angle + rotation)

      marker_view.paint(ctx)

      ctx.rotate(-(angle + rotation))
      ctx.translate(-x, -y)
    }
  }
}

export namespace Arc {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    xy: p.Property<Coordinate>
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
  declare properties: Arc.Props
  declare __view_type__: ArcView

  constructor(attrs?: Partial<Arc.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ArcView

    this.mixins<Arc.Mixins>(Line)

    this.define<Arc.Props>(({Angle, Number, Ref, /*NonNegative,*/ Array}) => ({
      xy:               [ Ref(Coordinate), () => new XY() ],
      radius:           [ Number, 0 ], // NonNegative
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Angle, 0 ],
      end_angle:        [ Angle, 0 ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
      decorations:      [ Array(Decoration), [] ],
    }))
  }
}
