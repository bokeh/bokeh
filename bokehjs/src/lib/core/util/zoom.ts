import type {Interval} from "../types"
import type {Scale} from "models/scales/scale"
import type {RangeInfo, RangeState} from "models/plots/range_manager"
import {minmax} from "core/util/math"

type Bounds = [number, number]

type ScaleRanges = RangeInfo & {
  factor: number
}

export function scale_interval(range: Interval, factor: number, center?: number | null): Bounds {
  const [min, max] = minmax(range.start, range.end)
  const x = center ?? (max + min) / 2.0
  const x0 = min - (min - x)*factor
  const x1 = max - (max - x)*factor
  return [x0, x1]
}

export function get_info(scales: Iterable<Scale>, [sxy0, sxy1]: Bounds): RangeState {
  const info: RangeState = new Map()
  for (const scale of scales) {
    const [start, end] = scale.r_invert(sxy0, sxy1)
    info.set(scale.source_range, {start, end})
  }
  return info
}

export function rescale(scales: Iterable<Scale>, factor: number, center?: number | null): RangeState {
  const output: RangeState = new Map()
  for (const scale of scales) {
    const [v0, v1] = scale_interval(scale.target_range, factor, center)
    const [start, end] = scale.r_invert(v0, v1)
    output.set(scale.source_range, {start, end})
  }
  return output
}

export function scale_range(x_scales: Iterable<Scale>, y_scales: Iterable<Scale>, _x_target: Interval, _y_range: Interval, factor: number,
    x_axis: boolean = true, y_axis: boolean = true, center?: {x?: number | null, y?: number | null} | null): ScaleRanges {
  /*
   * Utility function for zoom tools to calculate/create the zoom_info object
   * of the form required by `PlotView.update_range`.
   */
  const x_factor = x_axis ? factor : 0
  //const [sx0, sx1] = scale_interval(x_target, x_factor, center?.x)
  //const xrs = get_info(x_scales, [sx0, sx1])
  const xrs = rescale(x_scales, x_factor, center?.x)

  const y_factor = y_axis ? factor : 0
  //const [sy0, sy1] = scale_interval(y_range, y_factor, center?.y)
  //const yrs = get_info(y_scales, [sy0, sy1])
  const yrs = rescale(y_scales, y_factor, center?.y)

  // OK this sucks we can't set factor independently in each direction. It is used
  // for GMap plots, and GMap plots always preserve aspect, so effective the value
  // of 'dimensions' is ignored.
  return {xrs, yrs, factor}
}
