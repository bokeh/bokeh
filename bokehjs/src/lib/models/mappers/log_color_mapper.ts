import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Range1d} from "../ranges/range1d"
import {VectorTransform} from "core/vectorization"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"
import * as p from "core/properties"

// Math.log1p() is not supported by any version of IE, so let's use a polyfill based on
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p.
const log1p = Math.log1p != null ? Math.log1p : (x: number) => Math.log(1 + x)

export namespace LogColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ContinuousColorMapper.Props

  export type ScanData = {
    low: number
    high: number
    scale: number
  }
}

export interface LogColorMapper extends LogColorMapper.Attrs {}

export class LogColorMapper extends ContinuousColorMapper {
  properties: LogColorMapper.Props

  constructor(attrs?: Partial<LogColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LogColorMapper"
  }

  protected scan<T>(data: Arrayable<number>, palette: Arrayable<T>): LogColorMapper.ScanData {
    const n = palette.length
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const scale = n / (log1p(high) - log1p(low))  // subtract the low offset
    return {low, high, scale}
  }

  protected cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, {low, high, scale}: LogColorMapper.ScanData): T {
    const max_key = palette.length - 1

    if (d > high) {
      return high_color != null ? high_color : palette[max_key]
    }
    // This handles the edge case where d == high, since the code below maps
    // values exactly equal to high to palette.length, which is greater than
    // max_key
    if (d == high)
      return palette[max_key]
    else if (d < low)
      return low_color != null ? low_color : palette[0]

    // Get the key
    const log = log1p(d) - log1p(low)  // subtract the low offset
    let key = Math.floor(log*scale)

    // Deal with upper bound
    if (key > max_key) {
      key = max_key
    }

    return palette[key]
  }

  get_scale(target_range: Range1d): VectorTransform<number> {
    // TODO
  }
}
LogColorMapper.initClass()
