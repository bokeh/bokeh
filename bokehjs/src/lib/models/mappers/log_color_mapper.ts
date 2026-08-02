import {ContinuousColorMapper} from "./continuous_color_mapper"
import type {Arrayable} from "core/types"
import {logger} from "core/logging"
import {min, max} from "core/util/arrayable"
import {clamp} from "core/util/math"
import type * as p from "core/properties"

export type LogScanData = {
  min: number
  max: number
  scale: number
  is_reversed: boolean
}

export namespace LogColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props
}

export interface LogColorMapper extends LogColorMapper.Attrs {}

export class LogColorMapper extends ContinuousColorMapper {
  declare properties: LogColorMapper.Props

  protected constructor(attrs?: Partial<LogColorMapper.Attrs>) {
    super(attrs)
  }

  protected scan(data: Arrayable<number>, n: number): LogScanData {
    const low = this.low != null ? this.low : min(data)
    if (low <= 0) {
      logger.warn(`LogColorMapper detects invalid value "${low}" for parameter "low".`)
    }
    const high = this.high != null ? this.high : max(data)
    if (high <= 0) {
      logger.warn(`LogColorMapper detects invalid value "${high}" for parameter "high".`)
    }
    const scale = n / Math.log(high / low)  // subtract the low offset
    const is_reversed = high < low
    return {max: high, min: low, scale, is_reversed}
  }

  override index_to_value(index: number): number {
    const scan_data = this._scan_data as LogScanData
    return scan_data.min * Math.exp(index / Math.abs(scan_data.scale))
  }

  override value_to_index(value: number, palette_length: number): number {
    const scan_data = this._scan_data as LogScanData

    // This handles the edge case where value == high, since the code below maps
    // values exactly equal to high to palette.length when it should be one less.
    if (value == scan_data.max) {
      return palette_length - 1
    }

    if (scan_data.is_reversed) {
      if (value > scan_data.min) {
        return -1
      } else if (value < scan_data.max) {
        return palette_length
      }
    } else {
      if (value > scan_data.max) {
        return palette_length
      } else if (value < scan_data.min) {
        return -1
      }
    }

    const log = Math.log(value / scan_data.min)
    const index = Math.abs(Math.floor(log * scan_data.scale))
    return clamp(index, -1, palette_length)
  }
}
