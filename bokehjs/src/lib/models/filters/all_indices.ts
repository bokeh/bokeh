import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace AllIndices {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {}
}

export interface AllIndices extends AllIndices.Attrs {}

export class AllIndices extends Filter {
  declare properties: AllIndices.Props

  constructor(attrs?: Partial<AllIndices.Attrs>) {
    super(attrs)
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const size = source.get_length() ?? 1
    return Indices.all_set(size)
  }
}
