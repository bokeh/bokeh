import type {IndexedDataSource} from "../sources/indexed_data_source"
import {ScalarExpression} from "./expression"
import {max} from "core/util/array"
import type * as p from "core/properties"

export namespace Maximum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number>
  }
}

export interface Maximum extends Maximum.Attrs {}

export class Maximum extends ScalarExpression<number> {
  declare properties: Maximum.Props

  static {
    this.define<Maximum.Props>(({Float, Str}) => ({
      field:   [ Str ],
      initial: [ Float, -Infinity ],
    }))
  }

  protected _compute(source: IndexedDataSource): number {
    const column = source.get_field(this.field) ?? []
    return Math.max(this.initial, max(column as number[]))
  }
}
