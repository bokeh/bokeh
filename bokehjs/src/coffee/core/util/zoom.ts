import {IRange} from "./bbox"
import {clamp} from "./math"

import {CartesianFrame} from "models/canvas/cartesian_frame"
import {Scale} from "models/scales/scale"

// Module for zoom-related functions

export function scale_highlow(range: IRange, factor: number, center?: number): [number, number] {
  const [low, high] = [range.start, range.end]
  const x = center != null ? center : (high + low) / 2.0
  const x0 = low - (low - x) * factor
  const x1 = high - (high - x) * factor
  return [x0, x1]
}

export function get_info(scales: {[key: string]: Scale}, [sxy0, sxy1]: [number, number]): {[key: string]: IRange} {
  const info: {[key: string]: IRange} = {}
  for (const name in scales) {
    const scale = scales[name]
    const [start, end] = scale.r_invert(sxy0, sxy1)
    info[name] = {start: start, end: end}
  }
  return info
}

export function scale_range(frame: CartesianFrame, factor: number,
    h_axis: boolean = true, v_axis: boolean = true, center?: {x: number, y: number}): {
      xrs: {[key: string]: IRange},
      yrs: {[key: string]: IRange},
      factor: number,
    } {
  /*
   * Utility function for zoom tools to calculate/create the zoom_info object
   * of the form required by ``PlotCanvasView.update_range``
   *
   * Parameters:
   *   frame : CartesianFrame
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
  const [sx0, sx1] = scale_highlow(frame.bbox.h_range, hfactor, center != null ? center.x : undefined)
  const xrs = get_info(frame.xscales, [sx0, sx1])

  const vfactor = v_axis ? factor : 0
  const [sy0, sy1] = scale_highlow(frame.bbox.v_range, vfactor, center != null ? center.y : undefined)
  const yrs = get_info(frame.yscales, [sy0, sy1])

  // OK this sucks we can't set factor independently in each direction. It is used
  // for GMap plots, and GMap plots always preserve aspect, so effective the value
  // of 'dimensions' is ignored.
  return {
    xrs: xrs,
    yrs: yrs,
    factor: factor,
  }
}
