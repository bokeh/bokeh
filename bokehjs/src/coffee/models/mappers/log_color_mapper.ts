import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"

// Math.log1p() is not supported by any version of IE, so let's use a polyfill based on
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p.
const log1p = Math.log1p != null ? Math.log1p : (x: number) => Math.log(1 + x)

export namespace LogColorMapper {
  export interface Attrs extends ContinuousColorMapper.Attrs {}

  export interface Props extends ContinuousColorMapper.Props {}
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

  protected _get_values(data: Arrayable<number>, palette: Uint32Array): Arrayable<number> {
    const n = palette.length
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const scale = n / (log1p(high) - log1p(low))  // subtract the low offset
    const max_key = palette.length - 1
    const values: number[] = []

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      // Check NaN
      if (isNaN(d)) {
        values.push(this._nan_color)
        continue
      }

      if (d > high) {
        values.push(this._high_color != null ? this._high_color : palette[max_key])
        continue
      }

      // This handles the edge case where d == high, since the code below maps
      // values exactly equal to high to palette.length, which is greater than
      // max_key
      if (d == high) {
        values.push(palette[max_key])
        continue
      }

      if (d < low) {
        values.push(this._low_color != null ? this._low_color : palette[0])
        continue
      }

      // Get the key
      const log = log1p(d) - log1p(low)  // subtract the low offset
      let key = Math.floor(log * scale)

      // Deal with upper bound
      if (key > max_key)
        key = max_key

      values.push(palette[key])
    }

    return values
  }
}
LogColorMapper.initClass()
