import type {CategoricalMapper} from "./categorical_mapper"
import {cat_v_compute} from "./categorical_mapper"
import type {Factor} from "../ranges/factor_range"
import {FactorSeq} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import type * as p from "core/properties"
import type {Arrayable} from "core/types"
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
    this.define<CategoricalPatternMapper.Props>(({Float, List, Nullable}) => ({
      factors:       [ FactorSeq ],
      patterns:      [ List(HatchPatternType) ],
      start:         [ Float, 0 ],
      end:           [ Nullable(Float), null ],
      default_value: [ HatchPatternType, " " ],
    }))
  }

  v_compute(xs: Arrayable<Factor | number | null>): Arrayable<string> {
    const values: string[] = new Array(xs.length)
    cat_v_compute(xs, this.factors, this.patterns, values, this.start, this.end, this.default_value)
    return values
  }
}
