import {Shape, ShapeView} from "./shape"
import {Coordinate, XY} from "../coordinates"
import {Scale} from "../scales/scale"
import {PanEvent, Pannable} from "core/ui_events"
import {Signal} from "core/signaling"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, Direction, RadiusDimension} from "core/enums"
import * as visuals from "core/visuals"
import * as p from "core/properties"
import * as cursors from "core/util/cursors"
import {assert} from "core/util/assert"
import {Context2d} from "core/util/canvas"
import {min, max, compute_angle, angle_between} from "core/util/math"

type Geometry = {
  sx: number
  sy: number
  sinner_radius: number
  souter_radius: number
  start_angle: number
  end_angle: number
  anticlock: boolean
}

type HitTarget = "outer_edge" | "inner_edge" | "start_edge" | "end_edge" | "area"

export class AnnularWedgeView extends ShapeView implements Pannable {
  override model: AnnularWedge
  override visuals: AnnularWedge.Visuals

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

  get geometry(): Geometry {
    const center = this.resolve(this.model.center)
    assert(center instanceof XY)

    const xc = this.x_coordinates(center)
    const yc = this.y_coordinates(center)

    const {inner_radius, outer_radius} = this.model
    return {
      sx: xc.compute(center.x),
      sy: yc.compute(center.y),
      sinner_radius: this.sradius(center, inner_radius),
      souter_radius: this.sradius(center, outer_radius),
      start_angle: this.start_angle,
      end_angle: this.end_angle,
      anticlock: this.anticlock,
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, start_angle, end_angle, sinner_radius, souter_radius, anticlock} = this.geometry
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

  override interactive_hit(sx: number, sy: number): boolean {
    if (!this.model.visible || !this.model.editable)
      return false
    return this._hit_test(sx, sy) != null
  }

  protected _hit_test(csx: number, csy: number): HitTarget | null {
    const {sx, sy, sinner_radius, souter_radius, start_angle, end_angle, anticlock} = this.geometry

    const dist = (sx - csx)**2 + (sy - csy)**2

    const or2 = souter_radius**2
    const ir2 = sinner_radius**2

    if (ir2 <= dist && dist <= or2) {
      // NOTE: minus the angle because JS uses non-mathy convention for angles
      const angle = Math.atan2(csy - sy, csx - sx)
      if (angle_between(-angle, -start_angle, -end_angle, anticlock)) {
        return "area"
      }
    }

    return null
  }

  protected _can_hit(target: HitTarget): boolean {
    return this.model.center instanceof XY && target == "area"
  }

  protected _pan_state: {geometry: Geometry, target: HitTarget} | null = null

  on_pan_start(ev: PanEvent): boolean {
    if (this.model.visible && this.model.editable) {
      const {sx, sy} = ev
      const target = this._hit_test(sx, sy)
      if (target != null && this._can_hit(target)) {
        this._pan_state = {geometry: this.geometry, target}
        this.model.pan.emit("pan:start")
        return true
      }
    }
    return false
  }

  on_pan(ev: PanEvent): void {
    assert(this._pan_state != null)

    const [sx, sy] = (() => {
      const {dx, dy} = ev
      const {sx, sy} = this._pan_state.geometry
      return [sx + dx, sy + dy]
    })()

    const {center} = this.model
    assert(center instanceof XY)
    const x = this.x_coordinates(center).invert(sx)
    const y = this.y_coordinates(center).invert(sy)

    center.setv({x, y})
    this.request_paint()

    this.model.pan.emit("pan")
  }

  on_pan_end(_ev: PanEvent): void {
    this._pan_state = null
    this.model.pan.emit("pan:end")
  }

  override cursor(sx: number, sy: number): string | null {
    const target = this._pan_state?.target ?? this._hit_test(sx, sy)
    if (target == null || !this._can_hit(target))
      return null

    switch (target) {
      case "outer_edge":
      case "inner_edge":
      case "start_edge":
      case "end_edge":
        return cursors.x_pan
      case "area":
        return cursors.pan
    }
  }
}

export namespace AnnularWedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    center: p.Property<Coordinate>
    inner_radius: p.Property<number>
    outer_radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
    start_angle: p.Property<number>
    end_angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    editable: p.Property<boolean>
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

    this.define<AnnularWedge.Props>(({Boolean, Number, NonNegative, Ref}) => ({
      center:           [ Ref(Coordinate) ],
      inner_radius:     [ NonNegative(Number) ],
      outer_radius:     [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Number ],
      end_angle:        [ Number ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
      editable:         [ Boolean, false ],
    }))
  }

  readonly pan = new Signal<"pan:start" | "pan" | "pan:end", this>(this, "pan")
}
