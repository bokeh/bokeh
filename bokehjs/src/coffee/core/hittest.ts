import {union, sortBy} from "./util/array"
import {merge, isEmpty} from "./util/object"
import {Rect} from "./util/spatial"

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

const nullreturner: () => any = () => null  // stub function shared by all hittests by default

export interface Indices0d {
  glyph: any // | null
  get_view: () => any
  indices: number[]
}

export interface Indices1d {
  indices: number[]
}

export interface Indices2d {
  indices: {[key: string]: number[]} // XXX: [key: number]?
}

export class HitTestResult {

  [key: string]: any

  constructor() {
    // 0d is only valid for line and patch glyphs
    this['0d'] = {
      // the glyph that was picked
      glyph: null,
      get_view: nullreturner,  // this is a function, because setting the view causes inf. recursion
      // array with the [smallest] index of the segment of the line that was hit
      indices: [],
    };
    // 1d for all other glyphs apart from multilines and multi patches
    this['1d'] = {
      // index of the closest point to the crossed segment
      // useful for special glyphs like line that are continuous and
      // not discrete between 2 data points
      indices: []
    }
    // 2d for all for multilines and multi patches
    this['2d'] = {
      // mapping of indices of the multiglyph to array of glyph indices that were hit
      // e.g. {3: [5, 6], 4: [5]}
      indices: {}
    }
  }

  get _0d(): Indices0d { return this['0d'] }
  get _1d(): Indices1d { return this['1d'] }
  get _2d(): Indices2d { return this['2d'] }

  is_empty(): boolean {
    return this._0d.indices.length == 0 && this._1d.indices.length == 0 && isEmpty(this._2d.indices)
  }

  update_through_union(other: HitTestResult): void {
    this._0d.indices = union(other._0d.indices, this._0d.indices)
    this._0d.glyph = other._0d.glyph || this._0d.glyph
    this._1d.indices = union(other._1d.indices, this._1d.indices)
    this._2d.indices = merge(other._2d.indices, this._2d.indices)
  }
}

export function create_hit_test_result(): HitTestResult {
  return new HitTestResult()
}

export function create_1d_hit_test_result(hits: [number, number][]): HitTestResult {
  const result = new HitTestResult()
  result._1d.indices = sortBy(hits, ([_i, dist]) => dist).map(([i, _dist]) => i)
  return result
}

export function validate_bbox_coords([x0, x1]: [number, number], [y0, y1]: [number, number]): Rect {
  // rbush expects x0, y0 to be min, x1, y1 max
  if (x0 > x1) [x0, x1] = [x1, x0]
  if (y0 > y1) [y0, y1] = [y1, y0]
  return {minX: x0, minY: y0, maxX: x1, maxY: y1}
}

function sqr(x: number): number {
  return x*x
}

export function dist_2_pts(x0: number, y0: number, x1: number, y1: number): number {
  return sqr(x0 - x1) + sqr(y0 - y1)
}

export interface Point {
  x: number
  y: number
}

export function dist_to_segment_squared(p: Point, v: Point, w: Point): number {
  const l2 = dist_2_pts(v.x, v.y, w.x, w.y)
  if (l2 == 0)
    return dist_2_pts(p.x, p.y, v.x, v.y)
  const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  if (t < 0)
    return dist_2_pts(p.x, p.y, v.x, v.y)
  if (t > 1)
    return dist_2_pts(p.x, p.y, w.x, w.y)

  return dist_2_pts(p.x, p.y, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y))
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
