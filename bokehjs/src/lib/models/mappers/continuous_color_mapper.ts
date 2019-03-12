import {ColorMapper} from "./color_mapper"
import {Range1d} from "../ranges/range1d"
import {VectorTransform} from "core/vectorization"
import {Arrayable, Color} from "core/types"
import * as p from "core/properties"

export namespace ContinuousColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & {
    high: p.Property<number>
    low: p.Property<number>
    high_color: p.Property<Color>
    low_color: p.Property<Color>
  }
}

export interface ContinuousColorMapper extends ContinuousColorMapper.Attrs {}

export abstract class ContinuousColorMapper extends ColorMapper {
  properties: ContinuousColorMapper.Props

  constructor(attrs?: Partial<ContinuousColorMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "ContinuousColorMapper"

    this.define<ContinuousColorMapper.Props>({
      high:       [ p.Number ],
      low:        [ p.Number ],
      high_color: [ p.Color  ],
      low_color:  [ p.Color  ],
    })
  }

  protected abstract scan<T>(data: Arrayable<number>, palette: Arrayable<T>): unknown

  protected _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
    palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void {

    const {nan_color, low_color, high_color} = colors
    const scan_data = this.scan(data, palette)

    for (let i = 0, end = data.length; i < end; i++) {
      const d = data[i]

      if (isNaN(d))
        values[i] = nan_color
      else
        values[i] = this.cmap(d, palette, low_color, high_color, scan_data)
    }
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    return {
      ...super._colors(conv),
      low_color: this.low_color != null ? conv(this.low_color) : undefined,
      high_color: this.high_color != null ? conv(this.high_color) : undefined,
    }
  }

  protected abstract cmap<T>(d: number, palette: Arrayable<T>, low_color: T, high_color: T, scan_data: any): any

  abstract get_scale(target_range: Range1d): VectorTransform<number>
}
ContinuousColorMapper.initClass()
