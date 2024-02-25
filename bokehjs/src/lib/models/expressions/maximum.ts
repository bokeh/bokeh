import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {dict} from "core/util/object"
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

  constructor(attrs?: Partial<Maximum.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Maximum.Props>(({Float, Str}) => ({
      field:   [ Str ],
      initial: [ Float, -Infinity ],
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = dict(source.data).get(this.field) ?? []
    return Math.max(this.initial, max(column as number[]))
  }
}
