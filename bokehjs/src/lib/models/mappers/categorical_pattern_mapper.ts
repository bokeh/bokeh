import {CategoricalMapper, cat_v_compute} from "./categorical_mapper"
import {Factor, FactorSeq} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import * as p from "core/properties"
import {Arrayable, ArrayableOf} from "core/types"
import {HatchPatternType} from "core/enums"

export namespace CategoricalPatternMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props & CategoricalMapper.Props & {
    patterns: p.Property<HatchPatternType[]>
    default_value: p.Property<HatchPatternType>
  }
}

export interface CategoricalPatternMapper extends Mapper.Attrs, CategoricalMapper.Attrs, CategoricalPatternMapper.Attrs {}

export class CategoricalPatternMapper extends Mapper<string> {
  properties: CategoricalPatternMapper.Props

  constructor(attrs?: Partial<CategoricalPatternMapper.Attrs>) {
    super(attrs)
  }

  static init_CategoricalPatternMapper(): void {
    this.define<CategoricalPatternMapper.Props>(({Number, Array, Nullable}) => ({
      factors:       [ FactorSeq ],
      patterns:      [ Array(HatchPatternType) ],
      start:         [ Number, 0 ],
      end:           [ Nullable(Number), null ],
      default_value: [ HatchPatternType, " " ],
    }))
  }

  v_compute(xs: ArrayableOf<Factor>): Arrayable<string> {
    const values: string[] = new Array(xs.length)
    cat_v_compute(xs, this.factors, this.patterns, values, this.start, this.end, this.default_value)
    return values
  }
}
