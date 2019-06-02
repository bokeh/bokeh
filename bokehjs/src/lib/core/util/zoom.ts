import {Interval} from "../types"
import {clamp} from "./math"
import {BBox} from "./bbox"

// Module for zoom-related functions

export function scale_highlow(range: Interval, factor: number, center?: number): [number, number] {
  const [low, high] = [range.start, range.end]
  const x = center != null ? center : (high + low) / 2.0
  const x0 = low - (low - x) * factor
  const x1 = high - (high - x) * factor
  return [x0, x1]
}

export function scale_range(box: BBox, factor: number,
    h_axis: boolean = true, v_axis: boolean = true, center?: {x: number, y: number}): {
      sxr: {sx0: number, sx1: number},
      syr: {sy0: number, sy1: number},
      factor: number,
    } {
  /*
   * Utility function for zoom tools to calculate/create the zoom_info object
   * of the form required by ``PlotView.update_range``
   *
   * Parameters:
   *   box    : BBox
   *   factor : Number
   *   h_axis : Boolean, optional
   *     whether to zoom the horizontal axis (default = true)
   *   v_axis : Boolean, optional
   *     whether to zoom the horizontal axis (default = true)
   *   center : object, optional
   *     of form {'x': Number, 'y', Number}
   *
   * Returns:
   *   object:
   */

  // clamp the  magnitude of factor, if it is > 1 bad things happen
  factor = clamp(factor, -0.9, 0.9)

  const hfactor = h_axis ? factor : 0
  const [sx0, sx1] = scale_highlow(box.h_range, hfactor, center != null ? center.x : undefined)

  const vfactor = v_axis ? factor : 0
  const [sy0, sy1] = scale_highlow(box.v_range, vfactor, center != null ? center.y : undefined)

  // OK this sucks we can't set factor independently in each direction. It is used
  // for GMap plots, and GMap plots always preserve aspect, so effective the value
  // of 'dimensions' is ignored.
  return {sxr: {sx0, sx1}, syr: {sy0, sy1}, factor}
}
