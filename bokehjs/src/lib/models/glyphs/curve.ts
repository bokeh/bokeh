import type {Arrayable} from "core/types"

export type ScreenLine = {
  sx: Arrayable<number>
  sy: Arrayable<number>
}

type Point = [number, number]

const TAU = 2*Math.PI

function distance_to_line(point: Point, start: Point, end: Point): number {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const length = Math.hypot(dx, dy)
  if (length == 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1])
  }
  return Math.abs(dy*point[0] - dx*point[1] + end[0]*start[1] - end[1]*start[0])/length
}

function as_screen_line(points: Point[]): ScreenLine {
  const sx = new Float32Array(points.length)
  const sy = new Float32Array(points.length)
  for (let i = 0; i < points.length; i++) {
    sx[i] = points[i][0]
    sy[i] = points[i][1]
  }
  return {sx, sy}
}

export function quadratic_curve(
  start: Point, control: Point, end: Point, tolerance: number = 0.25, max_depth: number = 12,
): ScreenLine {
  const points: Point[] = [start]

  const subdivide = (p0: Point, p1: Point, p2: Point, depth: number) => {
    if (depth >= max_depth || distance_to_line(p1, p0, p2) <= tolerance) {
      points.push(p2)
      return
    }
    const p01: Point = [(p0[0] + p1[0])/2, (p0[1] + p1[1])/2]
    const p12: Point = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2]
    const mid: Point = [(p01[0] + p12[0])/2, (p01[1] + p12[1])/2]
    subdivide(p0, p01, mid, depth + 1)
    subdivide(mid, p12, p2, depth + 1)
  }

  subdivide(start, control, end, 0)
  return as_screen_line(points)
}

export function cubic_curve(
  start: Point, control0: Point, control1: Point, end: Point, tolerance: number = 0.25, max_depth: number = 12,
): ScreenLine {
  const points: Point[] = [start]

  const subdivide = (p0: Point, p1: Point, p2: Point, p3: Point, depth: number) => {
    const flatness = Math.max(distance_to_line(p1, p0, p3), distance_to_line(p2, p0, p3))
    if (depth >= max_depth || flatness <= tolerance) {
      points.push(p3)
      return
    }
    const p01: Point = [(p0[0] + p1[0])/2, (p0[1] + p1[1])/2]
    const p12: Point = [(p1[0] + p2[0])/2, (p1[1] + p2[1])/2]
    const p23: Point = [(p2[0] + p3[0])/2, (p2[1] + p3[1])/2]
    const p012: Point = [(p01[0] + p12[0])/2, (p01[1] + p12[1])/2]
    const p123: Point = [(p12[0] + p23[0])/2, (p12[1] + p23[1])/2]
    const mid: Point = [(p012[0] + p123[0])/2, (p012[1] + p123[1])/2]
    subdivide(p0, p01, p012, mid, depth + 1)
    subdivide(mid, p123, p23, p3, depth + 1)
  }

  subdivide(start, control0, control1, end, 0)
  return as_screen_line(points)
}

export function arc_sweep(start: number, end: number, anticlockwise: boolean): number {
  const raw = end - start
  if (Math.abs(raw) >= TAU) {
    return anticlockwise ? -TAU : TAU
  }
  let sweep = raw % TAU
  if (anticlockwise && sweep > 0) {
    sweep -= TAU
  } else if (!anticlockwise && sweep < 0) {
    sweep += TAU
  }
  return sweep
}

export function elliptical_arc(
  center: Point, radius_x: number, radius_y: number, rotation: number,
  start: number, end: number, anticlockwise: boolean, tolerance: number = 0.25,
): ScreenLine {
  const sweep = arc_sweep(start, end, anticlockwise)
  if (!isFinite(center[0] + center[1] + radius_x + radius_y + rotation + start + end) || sweep == 0) {
    return {sx: new Float32Array(0), sy: new Float32Array(0)}
  }

  const radius = Math.max(Math.abs(radius_x), Math.abs(radius_y))
  const max_step = radius <= tolerance ? Math.PI/4 :
    2*Math.acos(Math.max(-1, Math.min(1, 1 - tolerance/radius)))
  const segments = Math.max(2, Math.min(4096, Math.ceil(Math.abs(sweep)/Math.max(max_step, 1e-3))))
  const sx = new Float32Array(segments + 1)
  const sy = new Float32Array(segments + 1)
  const cos_rotation = Math.cos(rotation)
  const sin_rotation = Math.sin(rotation)

  for (let i = 0; i <= segments; i++) {
    const angle = start + sweep*i/segments
    const x = radius_x*Math.cos(angle)
    const y = radius_y*Math.sin(angle)
    sx[i] = center[0] + x*cos_rotation - y*sin_rotation
    sy[i] = center[1] + x*sin_rotation + y*cos_rotation
  }
  if (Math.abs(Math.abs(sweep) - TAU) < 1e-12) {
    sx[segments] = sx[0]
    sy[segments] = sy[0]
  }
  return {sx, sy}
}
