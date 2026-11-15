/**
 * Screen-space geometry of interactive (movable and resizable) boxes, shared
 * between canvas (e.g. `BoxAnnotation`) and DOM (e.g. `Dialog`) components.
 */
import type {LRTB, Corners} from "core/util/bbox"
import {BBox} from "core/util/bbox"
import {sign} from "core/util/math"
import type * as Box from "./box_kinds"

const {min} = Math

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
 * unbounded). Only limits of edges that are being moved are enforced, because
 * the other edge may already be outside the limits (e.g. a wide `RangeTool`
 * overlay), and compensating for it would make the moved edge jump away from
 * the pointer.
 */
function move_interval(start: number, end: number, start_delta: number, end_delta: number, lower: number, upper: number): [number, number] {
  let [new_start, new_end, start_sign, end_sign] = (() => {
    const new_start = start + start_delta
    const new_end = end + end_delta
    if (new_start <= new_end) {
      return [new_start, new_end, sign(start_delta), sign(end_delta)]
    } else {
      return [new_end, new_start, sign(end_delta), sign(start_delta)]
    }
  })()

  let correction = 0
  if (start_sign != 0 && new_start < lower) {
    correction = min(correction, new_start - lower)
  }
  if (end_sign != 0 && upper < new_end) {
    correction = min(correction, upper - new_end)
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
 * Moves or resizes `bbox` by dragging the given part of it by `(dx, dy)`, keeping
 * the moved edges within `limits` (`NaN` means unbounded). Limits are normalized,
 * so that e.g. limits mapped through an inverted scale still apply.
 */
export function move_bbox(bbox: BBox, target: Box.HitTarget, dx: number, dy: number, options: MoveOptions & {limits: LRTB}): MoveResult {
  const limits = BBox.from_lrtb(options.limits)
  const deltas = target_deltas(target, dx, dy, options)
  const [left, right] = move_interval(bbox.left, bbox.right, deltas.left, deltas.right, limits.left, limits.right)
  const [top, bottom] = move_interval(bbox.top, bbox.bottom, deltas.top, deltas.bottom, limits.top, limits.bottom)
  return {bbox: BBox.from_lrtb({left, right, top, bottom}), deltas}
}
