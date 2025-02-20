import type {Interval} from "../types"
import type {Scale} from "models/scales/scale"
import type {RangeInfo, RangeState} from "models/plots/range_manager"
import {assert} from "core/util/assert"
import {minmax} from "core/util/math"

type Bounds = [number, number]

type ScaleRanges = RangeInfo & {
  factor: number
}

export function scale_interval(range: Interval, factor: number, center?: number | null): Bounds {
  assert(Math.abs(factor) < 1)
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

  // Here we are a bit careful to only update the range info for dimensions that
  // are "in play". This is to avoid superfluous noise updates to dataranges that
  // would cause windowed auto-ranging to turn off.
  const xrs = x_axis ? rescale(x_scales, factor, center?.x) : new Map()
  const yrs = y_axis ? rescale(y_scales, factor, center?.y) : new Map()

  // OK this sucks we can't set factor independently in each direction. It is used
  // for GMap plots, and GMap plots always preserve aspect, so effective the value
  // of 'dimensions' is ignored.
  return {xrs, yrs, factor}
}
