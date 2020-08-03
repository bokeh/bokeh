import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
import * as p from "core/properties"

export type LogScanData = {
  min: number
  max: number
  scale: number
}

export namespace LogColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface LogColorMapper extends LogColorMapper.Attrs {}

export class LogColorMapper extends ContinuousColorMapper {
  properties: LogColorMapper.Props

  constructor(attrs?: Partial<LogColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan(data: Arrayable<number>, n: number): LogScanData {
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const scale = n / (Math.log(high) - Math.log(low))  // subtract the low offset
    return {max: high, min: low, scale}
  }

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, scan_data: LogScanData): T {
    const max_key = palette.length - 1

    if (d > scan_data.max) {
      return high_color
    }
    // This handles the edge case where d == high, since the code below maps
    // values exactly equal to high to palette.length, which is greater than
    // max_key
    if (d == scan_data.max)
      return palette[max_key]
    else if (d < scan_data.min)
      return low_color

    // Get the key
    const log = Math.log(d) - Math.log(scan_data.min)  // subtract the low offset
    let key = Math.floor(log * scan_data.scale)

    // Deal with upper bound
    if (key > max_key) {
      key = max_key
    }

    return palette[key]
  }
}
