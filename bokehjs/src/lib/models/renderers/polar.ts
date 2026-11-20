import type {PolarCoordinateTransform} from "../coordinates/polar_mapping"
import type {Context2d} from "core/util/canvas"

export function trace_polar_arc(ctx: Context2d, transform: PolarCoordinateTransform, radius: number): void {
  const [cx, cy] = transform.center
  const {start, end} = transform.mapping.angular_range
  ctx.arc(cx, cy, radius, transform.angle(start), transform.angle(end), transform.mapping.direction == "anticlock")
}

export function trace_polar_frame(ctx: Context2d, transform: PolarCoordinateTransform): void {
  if (!transform.validate()) {
    return
  }
  if (!transform.full_circle) {
    ctx.moveTo(...transform.center)
    ctx.lineTo(...transform.position(transform.radius, transform.mapping.angular_range.start))
  }
  trace_polar_arc(ctx, transform, transform.radius)
  ctx.closePath()
}
