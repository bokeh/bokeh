import {CategoricalMapper, cat_v_compute} from "./categorical_mapper"
import {Factor} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import * as p from "core/properties"
import {Arrayable, ArrayableOf} from "core/types"
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
  properties: CategoricalMarkerMapper.Props

  constructor(attrs?: Partial<CategoricalMarkerMapper.Attrs>) {
    super(attrs)
  }

  static init_CategoricalMarkerMapper(): void {
    this.define<CategoricalMarkerMapper.Props>({
      factors:       [ p.Array                ],
      markers:       [ p.Array                ],
      start:         [ p.Number,     0        ],
      end:           [ p.Number               ],
      default_value: [ p.MarkerType, "circle" ],
    })
  }

  v_compute(xs: ArrayableOf<Factor>): Arrayable<string> {
    const values: string[] = new Array(xs.length)
    cat_v_compute(xs, this.factors, this.markers, values, this.start, this.end, this.default_value)
    return values
  }
}
