import {Filter} from "./filter"
import * as p from "core/properties"
import {Indices} from "core/types"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace IndexFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    indices: p.Property<number[] | null>
  }
}

export interface IndexFilter extends IndexFilter.Attrs {}

export class IndexFilter extends Filter {
  properties: IndexFilter.Props

  constructor(attrs?: Partial<IndexFilter.Attrs>) {
    super(attrs)
  }

  static init_IndexFilter(): void {
    this.define<IndexFilter.Props>({
      indices: [ p.Array, null ],
    })
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const size = source.length
    const {indices} = this
    if (indices == null) {
      return Indices.all_set(size)
    } else {
      return Indices.from_indices(size, indices)
    }
  }
}
