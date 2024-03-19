import {Filter} from "./filter"
import type * as p from "core/properties"
import {PackedIndices} from "core/util/indices"
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

  compute_indices(source: ColumnarDataSource): PackedIndices {
    const size = source.get_length() ?? 1
    const {booleans} = this
    if (booleans == null) {
      return PackedIndices.all_set(size)
    } else {
      return PackedIndices.from_booleans(size, booleans)
    }
  }
}
