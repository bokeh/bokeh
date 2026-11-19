/**
 * Screen-space geometry of interactive (movable and resizable) boxes, shared
 * between canvas (e.g. `BoxAnnotation`) and DOM (e.g. `Dialog`) components.
 */
import type {LRTB, Corners} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {sign} from "core/util/math"
import type * as Box from "./box_kinds"

const {min, max} = Math

/** A value for each part (corner, edge or area) of a box. */
export type HitTargets<T> = {[key in Box.HitTarget]: T}

/**
 * Which edges and corners can be dragged to resize a box.
 */
export function resizable_edges(resizable: Box.Resizable): LRTB<boolean> & Corners<boolean> {
  const left = resizable == "left" || resizable == "x" || resizable == "all"
  const right = resizable == "right" || resizable == "x" || resizable == "all"
  const top = resizable == "top" || resizable == "y" || resizable == "all"
  const bottom = resizable == "bottom" || resizable == "y" || resizable == "all"
  return {
    left,
    right,
    top,
    bottom,
    top_left:     top    && left,
    top_right:    top    && right,
    bottom_left:  bottom && left,
    bottom_right: bottom && right,
  }
}

/**
 * Which parts of a box can be dragged, either to resize it or to move it.
 */
export function hittable(resizable: Box.Resizable, movable: boolean): HitTargets<boolean> {
  return {...resizable_edges(resizable), area: movable}
}

export type MoveOptions = {
  movable: Box.Movable
  symmetric: boolean
}

/**
 * How much each edge of a box moves when dragging the given part of it by `(dx, dy)`.
 */
export function target_deltas(target: Box.HitTarget, dx: number, dy: number, options: MoveOptions): LRTB {
  // `dx` and `dy` move the dragged edges, while `Dx` and `Dy` move the opposite
  // edges, i.e. mirror the drag when symmetric (keeping the center in place) and
  // leave them in place otherwise.
  const {movable, symmetric} = options
  const [Dx, Dy] = symmetric ? [-dx, -dy] : [0, 0]

  const [left, right, top, bottom] = (() => {
    switch (target) {
      // corners
      case "top_left":     return [dx, Dx, dy, Dy]
      case "top_right":    return [Dx, dx, dy, Dy]
      case "bottom_left":  return [dx, Dx, Dy, dy]
      case "bottom_right": return [Dx, dx, Dy, dy]
      // edges
      case "left":   return [dx, Dx, 0, 0]
      case "right":  return [Dx, dx, 0, 0]
      case "top":    return [0, 0, dy, Dy]
      case "bottom": return [0, 0, Dy, dy]
      // area
      case "area": {
        switch (movable) {
          case "both": return [dx, dx, dy, dy]
          case "x":    return [dx, dx,  0,  0]
          case "y":    return [ 0,  0, dy, dy]
          case "none": return [ 0,  0,  0,  0]
        }
      }
    }
  })()

  return {left, right, top, bottom}
}

/**
 * Moves the edges of an interval by the given deltas, swapping the edges if they
 * cross, and pushes the interval back within `[lower, upper]` (`NaN` means
 * unbounded). Limits only stop edges moving outwards, i.e. the lower limit stops
 * the start edge moving towards lower values and the upper limit stops the end
 * edge moving towards higher values. An edge that is already outside the limits
 * (e.g. a wide `RangeTool` overlay or a dialog positioned before its limits were
 * known) can move freely inwards and stays in place otherwise, because pushing
 * it within the limits would make the box jump away from the pointer.
 */
function move_interval(start: number, end: number, start_delta: number, end_delta: number, lower: number, upper: number): [number, number] {
  let [new_start, new_end, start_sign, end_sign, old_start, old_end] = (() => {
    const new_start = start + start_delta
    const new_end = end + end_delta
    if (new_start <= new_end) {
      return [new_start, new_end, sign(start_delta), sign(end_delta), start, end]
    } else {
      return [new_end, new_start, sign(end_delta), sign(start_delta), end, start]
    }
  })()

  // an edge that is already outside the limits can't move further out, but isn't pulled in
  const lower_bound = min(lower, old_start)
  const upper_bound = max(upper, old_end)

  let correction = 0
  if (start_sign < 0 && new_start < lower_bound) {
    correction = min(correction, new_start - lower_bound)
  }
  if (end_sign > 0 && upper_bound < new_end) {
    correction = min(correction, upper_bound - new_end)
  }

  new_start += start_sign*correction
  new_end += end_sign*correction

  return [new_start, new_end]
}

export type MoveResult = {
  /** The moved or resized box. */
  bbox: BBox
  /** Requested movement of each edge, before applying limits. */
  deltas: LRTB
}

/**
 * Lower and upper bounds of an interval, given limits of its start and end
 * edges, where a reversed limit bounds the opposite side.
 */
function interval_limits(start_limit: number, end_limit: number, start_reversed: boolean, end_reversed: boolean): [number, number] {
  let lower = NaN
  let upper = NaN

  const add = (limit: number, side: "lower" | "upper") => {
    if (isNaN(limit)) {
      return
    }
    switch (side) {
      case "lower": {
        lower = isNaN(lower) ? limit : max(lower, limit)
        break
      }
      case "upper": {
        upper = isNaN(upper) ? limit : min(upper, limit)
        break
      }
    }
  }

  add(start_limit, start_reversed ? "upper" : "lower")
  add(end_limit, end_reversed ? "lower" : "upper")

  return upper < lower ? [upper, lower] : [lower, upper]
}

const not_reversed: LRTB<boolean> = {left: false, right: false, top: false, bottom: false}

/**
 * Converts screen-space limits of a box, named by the edge they apply to (`NaN`
 * means unbounded), to lower (`left` and `top`) and upper (`right` and `bottom`)
 * screen-space bounds, as expected by `move_bbox()`.
 *
 * A limit is reversed when it was mapped through a reversed range (e.g. when
 * `x_range.start > x_range.end`). Then it bounds the opposite side on screen,
 * e.g. `left_limit` (the minimum `x` in data space) bounds the right side. If
 * both limits of a dimension bound the same side, the tighter one applies, and
 * if they cross, they're swapped.
 */
export function screen_limits(limits: LRTB, reversed: LRTB<boolean> = not_reversed): LRTB {
  const [left, right] = interval_limits(limits.left, limits.right, reversed.left, reversed.right)
  const [top, bottom] = interval_limits(limits.top, limits.bottom, reversed.top, reversed.bottom)
  return {left, right, top, bottom}
}

/**
 * Moves or resizes `bbox` by dragging the given part of it by `(dx, dy)`, keeping
 * the moved edges within `limits`, i.e. lower (`left` and `top`) and upper (`right`
 * and `bottom`) screen-space bounds (`NaN` means unbounded), see `screen_limits()`.
 */
export function move_bbox(bbox: BBox, target: Box.HitTarget, dx: number, dy: number, options: MoveOptions & {limits: LRTB}): MoveResult {
  const {limits} = options
  const deltas = target_deltas(target, dx, dy, options)
  const [left, right] = move_interval(bbox.left, bbox.right, deltas.left, deltas.right, limits.left, limits.right)
  const [top, bottom] = move_interval(bbox.top, bbox.bottom, deltas.top, deltas.bottom, limits.top, limits.bottom)
  return {bbox: BBox.from_lrtb({left, right, top, bottom}), deltas}
}
