import {Filter} from "./filter"
import * as p from "core/properties"
import {Indices} from "core/types"
import {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace IntersectionFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operands: p.Property<Filter[]>
  }
}

export interface IntersectionFilter extends IntersectionFilter.Attrs {}

export class IntersectionFilter extends Filter {
  override properties: IntersectionFilter.Props

  constructor(attrs?: Partial<IntersectionFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<IntersectionFilter.Props>(({Array, Ref}) => ({
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
        index.intersect(op)
      }
      return index
    }
  }
}
