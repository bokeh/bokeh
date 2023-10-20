import {ContinuousColorMapper} from "./continuous_color_mapper"
import type {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
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

  constructor(attrs?: Partial<LinearColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan(data: Arrayable<number>, n: number): LinearScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

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
}
