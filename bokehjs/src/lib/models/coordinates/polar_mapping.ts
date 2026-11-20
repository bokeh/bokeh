import {logger} from "core/logging"
import {CoordinateMapping} from "./coordinate_mapping"
import {CoordinateTransform} from "./coordinate_transform"
import {Range1d} from "../ranges/range1d"
import {LinearScale} from "../scales/linear_scale"
import type {CoordinateFrame} from "./coordinate_mapping"
import type {Arrayable, FloatArray} from "core/types"
import {ScreenArray} from "core/types"
import {AngleUnits, Direction} from "core/enums"
import {compute_angle, invert_angle, to_radians_coeff} from "core/util/math"
import type * as p from "core/properties"

export type PolarViewport = {x: number, y: number, scale: number}

export class PolarCoordinateTransform extends CoordinateTransform {
  constructor(
    readonly mapping: PolarMapping,
    readonly frame: CoordinateFrame,
    readonly viewport: PolarViewport = {x: 0, y: 0, scale: 1},
  ) {
    super(
      LinearScale.create({
        source_range: mapping.radial_range,
        target_range: Range1d.create({start: 0, end: 1}),
      }),
      LinearScale.create({
        source_range: mapping.angular_range,
        target_range: frame.y_target,
      }),
    )
  }

  override get is_separable(): boolean {
    return false
  }

  get center(): [number, number] {
    const {bbox} = this.frame
    return [bbox.hcenter + this.viewport.x, bbox.vcenter + this.viewport.y]
  }

  get radius(): number {
    const {width, height} = this.frame.bbox
    return Math.max(0, Math.min(width, height)/2 - this.mapping.padding)*this.viewport.scale
  }

  get period(): number {
    return 2*Math.PI/to_radians_coeff(this.mapping.angle_units)
  }

  get full_circle(): boolean {
    return Math.abs(this.mapping.angular_range.span - this.period) < 1e-10*this.period
  }

  get is_valid(): boolean {
    const {radial_range: r, angular_range: a} = this.mapping
    return [r.start, r.end, a.start, a.end].every(isFinite) && r.start >= 0 && r.end > r.start &&
      a.end > a.start && a.span <= this.period*(1 + 1e-10)
  }

  private _reported_invalid = false

  validate(): boolean {
    const valid = this.is_valid
    if (!valid && !this._reported_invalid) {
      logger.warn("Skipping invalid PolarMapping: use finite increasing nonnegative radial limits and angular limits spanning at most one revolution in angle_units")
    }
    this._reported_invalid = !valid
    return valid
  }

  angle(theta: number): number {
    const offset = {east: 0, north: -Math.PI/2, west: -Math.PI, south: Math.PI/2}[this.mapping.zero_direction]
    return offset + compute_angle(theta, this.mapping.angle_units, this.mapping.direction)
  }

  normalize(theta: number, start: number = this.mapping.angular_range.start): number {
    return start + ((theta - start)%this.period + this.period)%this.period
  }

  position(rho: number, theta: number): [number, number] {
    const [cx, cy] = this.center
    const phi = this.angle(theta)
    return [cx + rho*Math.cos(phi), cy + rho*Math.sin(phi)]
  }

  override compute(r: number, theta: number): [number, number] {
    const a = this.normalize(theta)
    const {radial_range, angular_range} = this.mapping
    if ((!isFinite(r) || !isFinite(theta)) || r < 0 || r < radial_range.start || r > radial_range.end || (!this.full_circle && a > angular_range.end)) {
      return [NaN, NaN]
    }
    return this.position(this.x_scale.compute(r)*this.radius, a)
  }

  override invert(sx: number, sy: number): [number, number] {
    if (!this.is_valid) {
      return [NaN, NaN]
    }
    const [cx, cy] = this.center
    const dx = sx - cx
    const dy = sy - cy
    const rho = Math.hypot(dx, dy)
    const r = this.x_scale.invert(rho/this.radius)
    const theta = rho == 0 ? NaN : this.normalize(invert_angle(Math.atan2(dy, dx) - this.angle(0), this.mapping.angle_units, this.mapping.direction))
    return [r, theta]
  }

  contains(sx: number, sy: number): boolean {
    const [cx, cy] = this.center
    if (!this.is_valid || !isFinite(sx) || !isFinite(sy) || this.radius <= 0 || Math.hypot(sx - cx, sy - cy) > this.radius) {
      return false
    }
    const [, theta] = this.invert(sx, sy)
    return this.full_circle || isNaN(theta) || theta <= this.mapping.angular_range.end
  }

  override map_to_screen(rs: Arrayable<number>, angles: Arrayable<number>): [ScreenArray, ScreenArray] {
    const sx = new ScreenArray(rs.length)
    const sy = new ScreenArray(rs.length)
    if (!this.validate()) {
      sx.fill(NaN)
      sy.fill(NaN)
      return [sx, sy]
    }
    for (let i = 0; i < rs.length; i++) {
      [sx[i], sy[i]] = this.compute(rs[i], angles[i])
    }
    return [sx, sy]
  }

  override map_from_screen(sx: Arrayable<number>, sy: Arrayable<number>): [FloatArray, FloatArray] {
    const r = new Float64Array(sx.length)
    const theta = new Float64Array(sx.length)
    for (let i = 0; i < sx.length; i++) {
      [r[i], theta[i]] = this.invert(sx[i], sy[i])
    }
    return [r, theta]
  }
}

export namespace PolarMapping {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateMapping.Props & {
    radial_range: p.Property<Range1d>
    angular_range: p.Property<Range1d>
    angle_units: p.Property<AngleUnits>
    zero_direction: p.Property<"east" | "north" | "west" | "south">
    direction: p.Property<Direction>
    padding: p.Property<number>
  }
}

export interface PolarMapping extends PolarMapping.Attrs {}

export class PolarMapping extends CoordinateMapping {
  declare properties: PolarMapping.Props

  static {
    this.define<PolarMapping.Props>(({Ref, Enum, Float, NonNegative}) => ({
      radial_range: [Ref(Range1d)],
      angular_range: [Ref(Range1d), () => Range1d.create({start: 0, end: 360})],
      angle_units: [AngleUnits, "deg"],
      zero_direction: [Enum("east", "north", "west", "south"), "east"],
      direction: [Direction, "anticlock"],
      padding: [NonNegative(Float), 40],
    }))
  }

  override get ranges(): readonly [Range1d, Range1d] {
    return [this.radial_range, this.angular_range]
  }

  override get_transform(frame: CoordinateFrame, viewport?: PolarViewport): PolarCoordinateTransform {
    return new PolarCoordinateTransform(this, frame, viewport)
  }
}
