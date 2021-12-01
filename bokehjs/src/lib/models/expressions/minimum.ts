import {ColumnarDataSource} from "../sources/columnar_data_source"
import {ScalarExpression} from "./expression"
import {obj} from "core/util/object"
import {min} from "core/util/array"
import * as p from "core/properties"

export namespace Minimum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ScalarExpression.Props & {
    field: p.Property<string>
    initial: p.Property<number>
  }
}

export interface Minimum extends Minimum.Attrs {}

export class Minimum extends ScalarExpression<number> {
  override properties: Minimum.Props

  constructor(attrs?: Partial<Minimum.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Minimum.Props>(({Number, String}) => ({
      field:   [ String ],
      initial: [ Number, Infinity ],
    }))
  }

  protected _compute(source: ColumnarDataSource): number {
    const column = obj(source.data).get(this.field) ?? []
    return Math.min(this.initial, min(column))
  }
}
