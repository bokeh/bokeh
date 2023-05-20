import {Filter} from "./filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace InversionFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operand: p.Property<Filter>
  }
}

export interface InversionFilter extends InversionFilter.Attrs {}

export class InversionFilter extends Filter {
  declare properties: InversionFilter.Props

  constructor(attrs?: Partial<InversionFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InversionFilter.Props>(({Ref}) => ({
      operand: [ Ref(Filter) ],
    }))
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const index = this.operand.compute_indices(source)
    index.invert()
    return index
  }
}
