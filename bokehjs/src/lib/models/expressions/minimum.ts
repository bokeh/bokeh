import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {min} from "core/util/array"
import * as p from "core/properties"

export namespace Minimum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number | null>
  }
}

export interface Minimum extends Minimum.Attrs {}

export class Minimum extends ScalarExpression<number> {
  override properties: Minimum.Props

  constructor(attrs?: Partial<Minimum.Attrs>) {
    super(attrs)
  }

  static init_Minimum(): void {
    this.define<Minimum.Props>(({Number, String, Nullable}) => ({
      field:   [ String ],
      initial: [ Nullable(Number), null ], // TODO: Infinity
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = source.data[this.field] ?? []
    return Math.min(this.initial ?? Infinity, min(column))
  }
}
