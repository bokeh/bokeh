import type {CategoricalMapper} from "./categorical_mapper"
import {cat_v_compute} from "./categorical_mapper"
import type {Factor} from "../ranges/factor_range"
import {FactorSeq} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import type * as p from "core/properties"
import type {Arrayable, ArrayableOf} from "core/types"
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
  declare properties: CategoricalPatternMapper.Props

  constructor(attrs?: Partial<CategoricalPatternMapper.Attrs>) {
    super(attrs)
  }

  static {
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
