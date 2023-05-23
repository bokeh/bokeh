import {Placeholder, PlaceholderView} from "./placeholder"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index as DataIndex} from "core/util/templating"
import {_get_column_value} from "core/util/templating"
import type * as p from "core/properties"

export class ValueRefView extends PlaceholderView {
  declare model: ValueRef

  update(source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
    const value = _get_column_value(this.model.field, source, i)
    const text = value == null ? "???" : `${value}` //.toString()
    this.el.textContent = text
  }
}

export namespace ValueRef {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props & {
    field: p.Property<string>
  }
}

export interface ValueRef extends ValueRef.Attrs {}

export class ValueRef extends Placeholder {
  declare properties: ValueRef.Props
  declare __view_type__: ValueRefView

  constructor(attrs?: Partial<ValueRef.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ValueRefView
    this.define<ValueRef.Props>(({String}) => ({
      field: [ String ],
    }))
  }
}
