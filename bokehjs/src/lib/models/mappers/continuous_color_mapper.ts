import {ColorMapper} from "./color_mapper"
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

  static init_ContinuousColorMapper(): void {
    this.define<ContinuousColorMapper.Props>({
      high:       [ p.Number ],
      low:        [ p.Number ],
      high_color: [ p.Color  ],
      low_color:  [ p.Color  ],
    })
  }

  protected _colors<T>(conv: (c: Color) => T): {nan_color: T, low_color?: T, high_color?: T} {
    return {
      ...super._colors(conv),
      low_color: this.low_color != null ? conv(this.low_color) : undefined,
      high_color: this.high_color != null ? conv(this.high_color) : undefined,
    }
  }

  protected abstract _v_compute<T>(data: Arrayable<number>, values: Arrayable<T>,
    palette: Arrayable<T>, colors: {nan_color: T, low_color?: T, high_color?: T}): void
}
