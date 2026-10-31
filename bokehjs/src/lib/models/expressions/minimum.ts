import type {IndexedDataSource} from "../sources/indexed_data_source"
import {ScalarExpression} from "./expression"
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

  static {
    this.define<Minimum.Props>(({Float, Str}) => ({
      field:   [ Str ],
      initial: [ Float, Infinity ],
    }))
  }

  protected _compute(source: IndexedDataSource): number {
    const column = source.get_field(this.field) ?? []
    return Math.min(this.initial, min(column as number[]))
  }
}
