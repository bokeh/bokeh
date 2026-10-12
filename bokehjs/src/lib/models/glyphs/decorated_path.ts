import type {Arrayable} from "core/types"
import type {RectGeometry} from "core/geometry"
import type {Context2d} from "core/util/canvas"
import * as hittest from "core/hittest"
import {atan2} from "core/util/math"
import type {DecorationView} from "../graphics/decoration"
import type {MarkingGeometry} from "../graphics/marking"

export type PathSegment = {
  index: number
  sx0: number
  sy0: number
  sx1: number
  sy1: number
  length: number
  move: boolean
}

export type PathNode = {
  index: number
  sx: number
  sy: number
  angle: number
}

export function path_segments(sx: Arrayable<number>, sy: Arrayable<number>): PathSegment[] {
  const segments: PathSegment[] = []
  const n = Math.min(sx.length, sy.length)
  let move = true
  for (let i = 0; i < n - 1; i++) {
    const sx0 = sx[i]
    const sy0 = sy[i]
    const sx1 = sx[i + 1]
    const sy1 = sy[i + 1]
    if (!isFinite(sx0 + sy0 + sx1 + sy1)) {
      move = true
      continue
    }
    const length = Math.hypot(sx1 - sx0, sy1 - sy0)
    if (length != 0) {
      segments.push({index: i, sx0, sy0, sx1, sy1, length, move})
      move = false
    }
  }
  return segments
}

export function path_length(segments: PathSegment[]): number {
  return segments.reduce((total, segment) => total + segment.length, 0)
}

export function path_interval(segments: PathSegment[], start: number, end: number): PathSegment[] {
  const selected: PathSegment[] = []
  let distance = 0
  let previous: PathSegment | null = null
  let pen_down = false

  for (const segment of segments) {
    const segment_start = distance
    const segment_end = distance + segment.length
    distance = segment_end

    const visible_start = Math.max(start, segment_start)
    const visible_end = Math.min(end, segment_end)
    if (visible_start >= visible_end) {
      previous = segment
      continue
    }

    const start_fraction = (visible_start - segment_start)/segment.length
    const end_fraction = (visible_end - segment_start)/segment.length
    const sx0 = segment.sx0 + start_fraction*(segment.sx1 - segment.sx0)
    const sy0 = segment.sy0 + start_fraction*(segment.sy1 - segment.sy0)
    const sx1 = segment.sx0 + end_fraction*(segment.sx1 - segment.sx0)
    const sy1 = segment.sy0 + end_fraction*(segment.sy1 - segment.sy0)

    const disconnected = segment.move || !pen_down || previous == null ||
      previous.sx1 != segment.sx0 || previous.sy1 != segment.sy0 || visible_start != segment_start
    selected.push({
      index: segment.index,
      sx0, sy0, sx1, sy1,
      length: visible_end - visible_start,
      move: disconnected,
    })
    pen_down = true
    previous = segment
  }

  return selected
}

export function trim_path(segments: PathSegment[], start: number, end: number): PathSegment[] {
  const total_length = path_length(segments)
  const path_start = Math.min(Math.max(0, start), total_length)
  const path_end = Math.max(path_start, total_length - Math.min(Math.max(0, end), total_length))
  return path_interval(segments, path_start, path_end)
}

export function trace_path(ctx: Context2d, segments: PathSegment[]): void {
  for (const {sx0, sy0, sx1, sy1, move} of segments) {
    if (move) {
      ctx.moveTo(sx0, sy0)
    }
    ctx.lineTo(sx1, sy1)
  }
}

export function point_on_path(segments: PathSegment[], distance: number): PathNode {
  const first = segments[0]
  if (distance <= 0) {
    const fraction = distance/first.length
    return {
      index: first.index,
      sx: first.sx0 + fraction*(first.sx1 - first.sx0),
      sy: first.sy0 + fraction*(first.sy1 - first.sy0),
      angle: atan2([first.sx0, first.sy0], [first.sx1, first.sy1]),
    }
  }

  let remaining = distance
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const fraction = remaining/segment.length
      return {
        index: segment.index,
        sx: segment.sx0 + fraction*(segment.sx1 - segment.sx0),
        sy: segment.sy0 + fraction*(segment.sy1 - segment.sy0),
        angle: atan2([segment.sx0, segment.sy0], [segment.sx1, segment.sy1]),
      }
    }
    remaining -= segment.length
  }

  const last = segments[segments.length - 1]
  const fraction = remaining/last.length
  return {
    index: last.index,
    sx: last.sx1 + fraction*(last.sx1 - last.sx0),
    sy: last.sy1 + fraction*(last.sy1 - last.sy0),
    angle: atan2([last.sx0, last.sy0], [last.sx1, last.sy1]),
  }
}

export type ScreenPoint = {x: number, y: number}

export type PositionedDecoration = {
  decoration: DecorationView
  index: number
  sx: number
  sy: number
  angle: number
}

export function position_decoration(decoration: DecorationView, i: number, segments: PathSegment[], total_length: number): PositionedDecoration {
  const {node} = decoration.model
  const inset = decoration.inset.get(i)
  const distance = Math.max(0, Math.min(total_length,
    node == "start" ? inset : node == "middle" ? total_length/2 : total_length - inset))
  const path_node = point_on_path(segments, distance)
  const angle = path_node.angle + Math.PI/2 + (node == "start" ? Math.PI : 0)
  return {decoration, index: path_node.index, sx: path_node.sx, sy: path_node.sy, angle}
}

export function transform_marking_geometry(geometry: MarkingGeometry, {sx, sy, angle}: PositionedDecoration): MarkingGeometry {
  const {cos, sin} = Math
  const c = cos(angle)
  const s = sin(angle)
  const x: number[] = []
  const y: number[] = []

  for (let i = 0; i < geometry.x.length; i++) {
    const x_i = geometry.x[i]
    const y_i = geometry.y[i]
    x.push(sx + c*x_i - s*y_i)
    y.push(sy + s*x_i + c*y_i)
  }
  return {...geometry, x, y}
}

export function marking_intersects_rect(marking: MarkingGeometry, geometry: RectGeometry): boolean {
  if (marking.x.length == 0 || marking.y.length == 0) {
    return false
  }

  for (let i = 0; i < marking.x.length; i++) {
    if (hittest.point_in_rect({x: marking.x[i], y: marking.y[i]}, geometry)) {
      return true
    }
  }

  const n = marking.type == "polygon" ? marking.x.length : marking.x.length - 1
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % marking.x.length
    if (hittest.segment_intersects_rect(
      {x: marking.x[i], y: marking.y[i]},
      {x: marking.x[j], y: marking.y[j]},
      geometry,
    )) {
      return true
    }
  }

  if (marking.type == "polygon") {
    const {min, max} = Math
    const x0 = min(geometry.sx0, geometry.sx1)
    const x1 = max(geometry.sx0, geometry.sx1)
    const y0 = min(geometry.sy0, geometry.sy1)
    const y1 = max(geometry.sy0, geometry.sy1)
    return hittest.point_in_poly(x0, y0, marking.x, marking.y) ||
      hittest.point_in_poly(x1, y0, marking.x, marking.y) ||
      hittest.point_in_poly(x1, y1, marking.x, marking.y) ||
      hittest.point_in_poly(x0, y1, marking.x, marking.y)
  }
  return false
}

export function paint_decorations(ctx: Context2d, decorations: Iterable<DecorationView>, i: number, segments: PathSegment[]): void {
  if (segments.length == 0) {
    return
  }
  const length = path_length(segments)
  for (const decoration of decorations) {
    const {sx, sy, angle} = position_decoration(decoration, i, segments, length)
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate(angle)
    decoration.marking.paint(ctx, i)
    ctx.restore()
  }
}

export function hit_decoration(point: ScreenPoint, decoration: DecorationView, i: number, segments: PathSegment[]): number | null {
  if (segments.length == 0) {
    return null
  }
  const positioned = position_decoration(decoration, i, segments, path_length(segments))
  const dx = point.x - positioned.sx
  const dy = point.y - positioned.sy
  const c = Math.cos(positioned.angle)
  const s = Math.sin(positioned.angle)
  return decoration.marking.contains(c*dx + s*dy, -s*dx + c*dy, i) ? positioned.index : null
}

/** Subdivide in screen space until both controls lie within 0.25px of the chord. */
export function cubic_path(x0: number, y0: number, cx0: number, cy0: number,
    cx1: number, cy1: number, x1: number, y1: number): PathSegment[] {
  if (!isFinite(x0 + y0 + cx0 + cy0 + cx1 + cy1 + x1 + y1)) {
    return []
  }
  const xs = [x0]
  const ys = [y0]
  function subdivide(ax: number, ay: number, bx: number, by: number,
      cx: number, cy: number, dx: number, dy: number, depth: number): void {
    const p0 = {x: ax, y: ay}
    const p1 = {x: dx, y: dy}
    if (depth == 12 || Math.max(hittest.dist_to_segment({x: bx, y: by}, p0, p1),
      hittest.dist_to_segment({x: cx, y: cy}, p0, p1)) <= 0.25) {
      xs.push(dx)
      ys.push(dy)
      return
    }
    const abx = (ax + bx)/2, aby = (ay + by)/2
    const bcx = (bx + cx)/2, bcy = (by + cy)/2
    const cdx = (cx + dx)/2, cdy = (cy + dy)/2
    const abc_x = (abx + bcx)/2, abc_y = (aby + bcy)/2
    const bcd_x = (bcx + cdx)/2, bcd_y = (bcy + cdy)/2
    const mx = (abc_x + bcd_x)/2, my = (abc_y + bcd_y)/2
    subdivide(ax, ay, abx, aby, abc_x, abc_y, mx, my, depth + 1)
    subdivide(mx, my, bcd_x, bcd_y, cdx, cdy, dx, dy, depth + 1)
  }
  subdivide(x0, y0, cx0, cy0, cx1, cy1, x1, y1, 0)
  return path_segments(xs, ys)
}

export function span_path_indices(segments: PathSegment[], direction: "h" | "v", value: number): number[] {
  return segments.filter(segment => {
    const a = direction == "h" ? segment.sx0 : segment.sy0
    const b = direction == "h" ? segment.sx1 : segment.sy1
    return Math.min(a, b) <= value && value <= Math.max(a, b)
  }).map(segment => segment.index)
}

export function decoration_hits_span(decoration: DecorationView, i: number, segments: PathSegment[], direction: "h" | "v", value: number): number | null {
  if (segments.length == 0) {
    return null
  }
  const geometry = decoration.marking.hit_geometry(i)
  if (geometry == null) {
    return null
  }
  const positioned = position_decoration(decoration, i, segments, path_length(segments))
  const marking = transform_marking_geometry(geometry, positioned)
  const values = direction == "h" ? marking.x : marking.y
  return Math.min(...values) <= value && value <= Math.max(...values) ? positioned.index : null
}

export function decoration_hits_rect(decoration: DecorationView, i: number, segments: PathSegment[], rect: RectGeometry): number | null {
  if (segments.length == 0) {
    return null
  }
  const geometry = decoration.marking.hit_geometry(i)
  if (geometry == null) {
    return null
  }
  const positioned = position_decoration(decoration, i, segments, path_length(segments))
  return marking_intersects_rect(transform_marking_geometry(geometry, positioned), rect) ? positioned.index : null
}
