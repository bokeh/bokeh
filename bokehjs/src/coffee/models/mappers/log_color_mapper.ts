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

  protected _get_values(data: Arrayable<number>, palette: Uint32Array, image_glyph: boolean = false): Arrayable<number> {
    const n = palette.length
    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const scale = n / (log1p(high) - log1p(low))  // subtract the low offset
    const max_key = palette.length - 1
    const values: number[] = []

    const nan_color = image_glyph ? this._nan_color : this.nan_color
    const high_color = image_glyph ? this._high_color : this.high_color
    const low_color = image_glyph ? this._low_color : this.low_color

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      // Check NaN
      if (isNaN(d)) {
        values.push(nan_color)
        continue
      }

      if (d > high) {
        values.push(this.high_color != null ? high_color : palette[max_key])
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
        values.push(this.low_color != null ? low_color : palette[0])
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
