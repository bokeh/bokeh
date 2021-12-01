import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {obj} from "core/util/object"
import {max} from "core/util/array"
import * as p from "core/properties"

export namespace Maximum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number>
  }
}

export interface Maximum extends Maximum.Attrs {}

export class Maximum extends ScalarExpression<number> {
  override properties: Maximum.Props

  constructor(attrs?: Partial<Maximum.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Maximum.Props>(({Number, String}) => ({
      field:   [ String ],
      initial: [ Number, -Infinity ],
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = obj(source.data).get(this.field) ?? []
    return Math.max(this.initial, max(column))
  }
}
