import type {Interval} from "../types"
import type {Scale} from "models/scales/scale"

type Bounds = [number, number]
type Scales = Map<string, Scale>
type Intervals = Map<string, Interval>

export type ScaleRanges = {
  xrs: Intervals
  yrs: Intervals
  factor: number
}

export function scale_highlow(range: Interval, factor: number, center?: number | null): Bounds {
  const [low, high] = [range.start, range.end]
  const x = center ?? (high + low) / 2.0
  const x0 = low - (low - x) * factor
  const x1 = high - (high - x) * factor
  return [x0, x1]
}

export function get_info(scales: Scales, [sxy0, sxy1]: Bounds): Intervals {
  const info: Intervals = new Map()
  for (const [name, scale] of scales) {
    const [start, end] = scale.r_invert(sxy0, sxy1)
    info.set(name, {start, end})
  }
  return info
}

export function scale_range(x_scales: Scales, y_scales: Scales, x_range: Interval, y_range: Interval, factor: number,
    x_axis: boolean = true, y_axis: boolean = true, center?: {x?: number | null, y?: number | null} | null): ScaleRanges {
  /*
   * Utility function for zoom tools to calculate/create the zoom_info object
   * of the form required by `PlotView.update_range`.
   */
  const x_factor = x_axis ? factor : 0
  const [sx0, sx1] = scale_highlow(x_range, x_factor, center?.x)
  const xrs = get_info(x_scales, [sx0, sx1])

  const y_factor = y_axis ? factor : 0
  const [sy0, sy1] = scale_highlow(y_range, y_factor, center?.y)
  const yrs = get_info(y_scales, [sy0, sy1])

  // OK this sucks we can't set factor independently in each direction. It is used
  // for GMap plots, and GMap plots always preserve aspect, so effective the value
  // of 'dimensions' is ignored.
  return {xrs, yrs, factor}
}
