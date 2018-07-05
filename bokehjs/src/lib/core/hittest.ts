import {sortBy} from "./util/array"
import {Rect} from "./util/spatial"
import {Selection} from "../models/selections/selection"

export type HitTestResult = Selection | null

export function point_in_poly(x: number, y: number, px: number[], py: number[]): boolean {
  let inside = false

  let x1 = px[px.length-1]
  let y1 = py[py.length-1]

  for (let i = 0; i < px.length; i++) {
    const x2 = px[i]
    const y2 = py[i]
    if ((y1 < y) != (y2 < y)) {
      if (x1 + (y - y1) / (y2 - y1)*(x2 - x1) < x)
        inside = !inside
    }
    x1 = x2
    y1 = y2
  }

  return inside
}

export function point_in_ellipse(x: number, y: number, angle: number, b: number, a: number, x0: number, y0: number): boolean {
  const A = ((Math.cos(angle) / a) ** 2 + (Math.sin(angle) / b) ** 2)
  const B = 2 * Math.cos(angle) * Math.sin(angle) * ((1 / a) ** 2 - (1 / b) ** 2)
  const C = ((Math.cos(angle) / b) ** 2 + (Math.sin(angle) / a) ** 2)
  const eqn = A * (x - x0) ** 2 + B * (x - x0) * (y - y0) + C * (y - y0) ** 2
  const inside = eqn <= 1
  return inside
}

export function create_empty_hit_test_result(): Selection {
  return new Selection()
}

export function create_hit_test_result_from_hits(hits: [number, number][]): Selection {
  const result = new Selection()
  result.indices = sortBy(hits, ([_i, dist]) => dist).map(([i, _dist]) => i)
  return result
}

export function validate_bbox_coords([x0, x1]: [number, number], [y0, y1]: [number, number]): Rect {
  // spatial index (flatbush) expects x0, y0 to be min, x1, y1 max
  if (x0 > x1) [x0, x1] = [x1, x0]
  if (y0 > y1) [y0, y1] = [y1, y0]
  return {minX: x0, minY: y0, maxX: x1, maxY: y1}
}

function sqr(x: number): number {
  return x * x
}

export interface Point {
  x: number
  y: number
}

export function dist_2_pts(p0: Point, p1: Point): number {
  return sqr(p0.x - p1.x) + sqr(p0.y - p1.y)
}

export function dist_to_segment_squared(p: Point, v: Point, w: Point): number {
  const l2 = dist_2_pts(v, w)
  if (l2 == 0)
    return dist_2_pts(p, v)
  const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  if (t < 0)
    return dist_2_pts(p, v)
  if (t > 1)
    return dist_2_pts(p, w)

  const q = {x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y)}
  return dist_2_pts(p, q)
}

export function dist_to_segment(p: Point, v: Point, w: Point): number {
  return Math.sqrt(dist_to_segment_squared(p, v, w))
}

export function check_2_segments_intersect(
  l0_x0: number, l0_y0: number, l0_x1: number, l0_y1: number,
  l1_x0: number, l1_y0: number, l1_x1: number, l1_y1: number): {
    hit: boolean,
    x: number | null,
    y: number | null,
  } {
  /*
   *  Check if 2 segments (l0 and l1) intersect. Returns a structure with
   *  the following attributes:
   *   * hit (boolean): whether the 2 segments intersect
   *   * x (float): x coordinate of the intersection point
   *   * y (float): y coordinate of the intersection point
   */
  const den = ((l1_y1 - l1_y0) * (l0_x1 - l0_x0)) - ((l1_x1 - l1_x0) * (l0_y1 - l0_y0))

  if (den == 0) {
    return {hit: false, x: null, y: null}
  } else {
    let a = l0_y0 - l1_y0
    let b = l0_x0 - l1_x0
    const num1 = ((l1_x1 - l1_x0) * a) - ((l1_y1 - l1_y0) * b)
    const num2 = ((l0_x1 - l0_x0) * a) - ((l0_y1 - l0_y0) * b)
    a = num1 / den
    b = num2 / den
    const x = l0_x0 + (a * (l0_x1 - l0_x0))
    const y = l0_y0 + (a * (l0_y1 - l0_y0))

    return {
      hit: (a > 0 && a < 1) && (b > 0 && b < 1),
      x: x,
      y: y,
    }
  }
}
