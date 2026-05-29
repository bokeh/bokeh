import {Filter} from "./filter"
import type * as p from "core/properties"
import {IndicesMask} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace IndexFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    indices: p.Property<Iterable<number> | null>
  }
}

export interface IndexFilter extends IndexFilter.Attrs {}

export class IndexFilter extends Filter {
  declare properties: IndexFilter.Props

  constructor(attrs?: Partial<IndexFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<IndexFilter.Props>(({Int, Iterable, Nullable}) => ({
      indices: [ Nullable(Iterable(Int)), null ],
    }))
  }

  compute_indices_mask(source: ColumnarDataSource): IndicesMask {
    const size = source.get_length() ?? 1
    const {indices} = this
    if (indices == null) {
      return IndicesMask.all_set(size)
    } else {
      return IndicesMask.from_indices(size, indices)
    }
  }
}
