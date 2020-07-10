import {Filter} from "./filter"
import * as p from "core/properties"
import {Indices} from "core/types"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace BooleanFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    booleans: p.Property<boolean[] | null>
  }
}

export interface BooleanFilter extends BooleanFilter.Attrs {}

export class BooleanFilter extends Filter {
  properties: BooleanFilter.Props

  constructor(attrs?: Partial<BooleanFilter.Attrs>) {
    super(attrs)
  }

  static init_BooleanFilter(): void {
    this.define<BooleanFilter.Props>({
      booleans: [ p.Array, null ],
    })
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const size = source.length
    const {booleans} = this
    if (booleans == null) {
      return Indices.all_set(size)
    } else {
      return Indices.from_booleans(size, booleans)
    }
  }
}
