import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {max} from "core/util/array"
import * as p from "core/properties"

export namespace Maximum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number | null>
  }
}

export interface Maximum extends Maximum.Attrs {}

export class Maximum extends ScalarExpression<number> {
  override properties: Maximum.Props

  constructor(attrs?: Partial<Maximum.Attrs>) {
    super(attrs)
  }

  static init_Maximum(): void {
    this.define<Maximum.Props>(({Number, String, Nullable}) => ({
      field:   [ String ],
      initial: [ Nullable(Number), null ], // TODO: -Infinity
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = source.data[this.field] ?? []
    return Math.max(this.initial ?? -Infinity, max(column))
  }
}
