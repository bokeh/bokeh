import type {CategoricalMapper} from "./categorical_mapper"
import {cat_v_compute} from "./categorical_mapper"
import type {Factor} from "../ranges/factor_range"
import {FactorSeq} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import type * as p from "core/properties"
import type {Arrayable} from "core/types"
import {MarkerType} from "core/enums"

export namespace CategoricalMarkerMapper {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Mapper.Props & CategoricalMapper.Props & {
    markers: p.Property<MarkerType[]>
    default_value: p.Property<MarkerType>
  }
}

export interface CategoricalMarkerMapper extends Mapper.Attrs, CategoricalMapper.Attrs, CategoricalMarkerMapper.Attrs {}

export class CategoricalMarkerMapper extends Mapper<string> {
  declare properties: CategoricalMarkerMapper.Props

  constructor(attrs?: Partial<CategoricalMarkerMapper.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CategoricalMarkerMapper.Props>(({Float, List, Nullable}) => ({
      factors:       [ FactorSeq ],
      markers:       [ List(MarkerType) ],
      start:         [ Float, 0 ],
      end:           [ Nullable(Float), null],
      default_value: [ MarkerType, "circle" ],
    }))
  }

  v_compute(xs: Arrayable<Factor | number | null>): Arrayable<string> {
    const values: string[] = new Array(xs.length)
    cat_v_compute(xs, this.factors, this.markers, values, this.start, this.end, this.default_value)
    return values
  }
}
