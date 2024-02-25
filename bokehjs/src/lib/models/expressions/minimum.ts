import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {dict} from "core/util/object"
import {min} from "core/util/array"
import type * as p from "core/properties"

export namespace Minimum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number>
  }
}

export interface Minimum extends Minimum.Attrs {}

export class Minimum extends ScalarExpression<number> {
  declare properties: Minimum.Props

  constructor(attrs?: Partial<Minimum.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Minimum.Props>(({Float, Str}) => ({
      field:   [ Str ],
      initial: [ Float, Infinity ],
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = dict(source.data).get(this.field) ?? []
    return Math.min(this.initial, min(column as number[]))
  }
}
