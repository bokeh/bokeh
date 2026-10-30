import {ContinuousColorMapper} from "./continuous_color_mapper"
import type {Arrayable, uint32} from "core/types"
import {min, max, minmax} from "core/util/arrayable"
import {clamp} from "core/util/math"
import type * as p from "core/properties"

export namespace LinearColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export type LinearScanData = {
  min: number
  max: number
  norm_factor: number
  normed_interval: number
}

export interface LinearColorMapper extends LinearColorMapper.Attrs {}

export class LinearColorMapper extends ContinuousColorMapper {
  declare properties: LinearColorMapper.Props

  protected scan(data: Arrayable<number>, n: number): LinearScanData {
    const [low, high] = (() => {
      if (this.low == null && this.high == null) {
        return minmax(data)
      } else {
        return [this.low ?? min(data), this.high ?? max(data)]
      }
    })()

    const norm_factor = 1 / (high - low)
    const normed_interval = 1 / n

    return {max: high, min: low, norm_factor, normed_interval}
  }

  override index_to_value(index: number): number {
    const scan_data = this._scan_data as LinearScanData
    return scan_data.min + scan_data.normed_interval*index / scan_data.norm_factor
  }

  override value_to_index(value: number, palette_length: number): number {
    const scan_data = this._scan_data as LinearScanData

    // This handles the edge case where value == high, since the code below maps
    // values exactly equal to high to palette.length when it should be one less.
    if (value == scan_data.max) {
      return palette_length - 1
    }

    const normed_value = (value - scan_data.min) * scan_data.norm_factor
    const index = Math.floor(normed_value / scan_data.normed_interval)
    return clamp(index, -1, palette_length)
  }

  // Equivalent to the generic implementation with `value_to_index()` inlined,
  // which is significantly faster for large images.
  protected override _map_values(data: Arrayable<number>, values: Arrayable<uint32>,
      palette: Arrayable<uint32>, colors: {nan_color: uint32, low_color: uint32, high_color: uint32}): void {
    const {nan_color, low_color, high_color} = colors
    const {min, max, norm_factor, normed_interval} = this._scan_data as LinearScanData

    const n = palette.length

    for (let i = 0, end = data.length; i < end; i++) {
      const value = data[i]

      if (isNaN(value)) {
        values[i] = nan_color
      } else {
        const index = value == max ? n - 1 : Math.floor((value - min) * norm_factor / normed_interval)
        if (index < 0) {
          values[i] = low_color
        } else if (index >= n) {
          values[i] = high_color
        } else {
          values[i] = palette[index]
        }
      }
    }
  }
}
