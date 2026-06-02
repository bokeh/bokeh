import {Filter} from "./filter"
import type * as p from "core/properties"
import {IndicesMask} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace BooleanFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    booleans: p.Property<Iterable<boolean> | null>
  }
}

export interface BooleanFilter extends BooleanFilter.Attrs {}

export class BooleanFilter extends Filter {
  declare properties: BooleanFilter.Props

  constructor(attrs?: Partial<BooleanFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BooleanFilter.Props>(({Bool, Iterable, Nullable}) => ({
      booleans: [ Nullable(Iterable(Bool)), null ],
    }))
  }

  compute_indices_mask(source: ColumnarDataSource): IndicesMask {
    const size = source.get_length() ?? 1
    const {booleans} = this
    if (booleans == null) {
      return IndicesMask.all_set(size)
    } else {
      return IndicesMask.from_booleans(size, booleans)
    }
  }
}
