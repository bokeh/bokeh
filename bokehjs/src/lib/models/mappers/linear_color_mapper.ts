import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Range1d} from "../ranges/range1d"
import {VectorTransform} from "core/vectorization"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
import * as p from "core/properties"

export namespace LinearColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props

  export type ScanData = {
    low: number
    high: number
    norm_factor: number
    normed_interval: number
  }
}

export interface LinearColorMapper extends LinearColorMapper.Attrs {}

export class LinearColorMapper extends ContinuousColorMapper {
  properties: LinearColorMapper.Props

  constructor(attrs?: Partial<LinearColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LinearColorMapper"
  }

  protected scan<T>(data: Arrayable<number>, palette: Arrayable<T>): LinearColorMapper.ScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)

    const norm_factor = 1 / (high - low)
    const normed_interval = 1 / palette.length

    return {high, low, norm_factor, normed_interval}
  }

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, {low, high, norm_factor, normed_interval}: LinearColorMapper.ScanData): T {
    // This handles the edge case where d == high, since the code below maps
    // values exactly equal to high to palette.length, which is greater than
    // max_key
    const max_key = palette.length - 1
    if (d == high)
      return palette[max_key]

    const normed_d = (d - low)*norm_factor
    const key = Math.floor(normed_d/normed_interval)
    if (key < 0)
      return low_color != null ? low_color : palette[0]
    else if (key > max_key)
      return high_color != null ? high_color : palette[max_key]
    else
      return palette[key]
  }

  get_scale(target_range: Range1d): VectorTransform<number> {
    // TODO
  }
}
LinearColorMapper.initClass()
