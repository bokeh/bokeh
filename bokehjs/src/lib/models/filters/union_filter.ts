import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace UnionFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operands: p.Property<Filter[]>
  }
}

export interface UnionFilter extends UnionFilter.Attrs {}

export class UnionFilter extends Filter {
  declare properties: UnionFilter.Props

  constructor(attrs?: Partial<UnionFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<UnionFilter.Props>(({Array, Ref}) => ({
      operands: [ Array(Ref(Filter)) ],
    }))
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const {operands} = this
    if (operands.length == 0) {
      const size = source.get_length() ?? 1
      return Indices.all_set(size)
    } else {
      const [index, ...rest] = operands.map((op) => op.compute_indices(source))
      for (const op of rest) {
        index.add(op)
      }
      return index
    }
  }
}
