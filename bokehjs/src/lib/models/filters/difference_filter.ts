import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace DifferenceFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operands: p.Property<Filter[]>
  }
}

export interface DifferenceFilter extends DifferenceFilter.Attrs {}

export class DifferenceFilter extends Filter {
  declare properties: DifferenceFilter.Props

  constructor(attrs?: Partial<DifferenceFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DifferenceFilter.Props>(({Array, Ref}) => ({
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
        index.subtract(op)
      }
      return index
    }
  }
}
