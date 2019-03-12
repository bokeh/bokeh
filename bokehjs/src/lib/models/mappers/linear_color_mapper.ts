import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
import * as p from "core/properties"

export namespace LinearColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface LinearScanData {
  high: number
  low: number
  norm_factor: number
  normed_interval: number
}

export interface LinearColorMapper extends LinearColorMapper.Attrs {}

export class LinearColorMapper extends ContinuousColorMapper {
  properties: LinearColorMapper.Props

  constructor(attrs?: Partial<LinearColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan<T>(data: Arrayable<number>, palette: Arrayable<T>): LinearScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

    const norm_factor = 1 / (high - low)
    const normed_interval = 1 / palette.length

    return {high, low, norm_factor, normed_interval}
  }

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, scan_data: LinearScanData): T {
    // This handles the edge case where d == high, since the code below maps
    // values exactly equal to high to palette.length, which is greater than
    // max_key
    const max_key = palette.length - 1
    if (d == scan_data.high) {
      return palette[max_key]
    }

    const normed_d = (d - scan_data.low) * scan_data.norm_factor
    const key = Math.floor(normed_d / scan_data.normed_interval)
    if (key < 0)
      return low_color
    else if (key > max_key)
      return high_color
    else
      return palette[key]
  }
}
