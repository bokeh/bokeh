import {CategoricalMapper, cat_v_compute} from "./categorical_mapper"
import {ColorMapper} from "./color_mapper"
import {Factor} from "../ranges/factor_range"

import * as p from "core/properties"
import {Arrayable, ArrayableOf} from "core/types"

export namespace CategoricalColorMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColorMapper.Props & CategoricalMapper.Props
}

export interface CategoricalColorMapper extends CategoricalColorMapper.Attrs {}

export class CategoricalColorMapper extends ColorMapper {
  properties: CategoricalColorMapper.Props

  constructor(attrs?: Partial<CategoricalColorMapper.Attrs>) {
    super(attrs)
  }

  static init_CategoricalColorMapper(): void {
    this.define<CategoricalColorMapper.Props>({
      factors: [ p.Array     ],
      start:   [ p.Number, 0 ],
      end:     [ p.Number    ],
    })
  }

  protected _v_compute<T>(data: ArrayableOf<Factor>, values: Arrayable<T>,
      palette: Arrayable<T>, {nan_color}: {nan_color: T}): void {
    cat_v_compute(data, this.factors, palette, values, this.start, this.end, nan_color)
  }
}
