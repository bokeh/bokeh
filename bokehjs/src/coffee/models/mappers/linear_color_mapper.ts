import {ContinuousColorMapper} from "./continuous_color_mapper"
import {Arrayable} from "core/types"
import {min, max} from "core/util/arrayable"

export namespace LinearColorMapper {
  export interface Attrs extends ContinuousColorMapper.Attrs {}

  export interface Props extends ContinuousColorMapper.Props {}
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

  protected _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
      palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {
    const {nan_color, low_color, high_color} = colors

    const low = this.low != null ? this.low : min(data)
    const high = this.high != null ? this.high : max(data)
    const max_key = palette.length - 1

    const norm_factor = 1 / (high - low)
    const normed_interval = 1 / palette.length

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      if (isNaN(d)) {
        values[i] = nan_color
        continue
      }

      // This handles the edge case where d == high, since the code below maps
      // values exactly equal to high to palette.length, which is greater than
      // max_key
      if (d == high) {
        values[i] = palette[max_key]
        continue
      }

      const normed_d = (d - low) * norm_factor
      const key = Math.floor(normed_d / normed_interval)
      if (key < 0)
        values[i] = low_color != null ? low_color : palette[0]
      else if (key > max_key)
        values[i] = high_color != null ? high_color : palette[max_key]
      else
        values[i] = palette[key]
    }
  }
}
LinearColorMapper.initClass()
