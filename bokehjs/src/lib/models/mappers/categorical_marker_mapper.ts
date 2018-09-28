import {CategoricalMapper, cat_v_compute} from "./categorical_mapper"
import {Factor} from "../ranges/factor_range"
import {Mapper} from "./mapper"

import * as p from "core/properties"
import {Arrayable} from "core/types"

export namespace CategoricalMarkerMapper {
  export interface Attrs extends Mapper.Attrs, CategoricalMapper.Attrs {}

  export interface Props extends Mapper.Props {}
}

export interface CategoricalMarkerMapper extends Mapper.Attrs, CategoricalMapper.Attrs {
  markers: string[]
}

export class CategoricalMarkerMapper extends Mapper<string> {

  properties: CategoricalMarkerMapper.Props

  constructor(attrs?: Partial<CategoricalMarkerMapper.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CategoricalMarkerMapper"

    this.define({
      factors: [ p.Array     ],
      markers: [ p.Array     ],
      start:   [ p.Number, 0 ],
      end:     [ p.Number    ],
    })
  }

  v_compute(xs: Arrayable<Factor>): Arrayable<string> {
    const values: string[] = new Array(xs.length)
    cat_v_compute(xs, this.factors, this.markers, values, this.start, this.end, "circle")
    return values
  }

}
CategoricalMarkerMapper.initClass()
