import {FlexBox, FlexBoxView} from "./flex_box"
import type * as p from "core/properties"

export class ColumnView extends FlexBoxView {
  declare model: Column
  protected _direction = "column" as const
}

export namespace Column {
  export type Attrs = p.AttrsOf<Props>
  export type Props = FlexBox.Props
}

export interface Column extends Column.Attrs {}

export class Column extends FlexBox {
  declare properties: Column.Props
  declare __view_type__: ColumnView

  constructor(attrs?: Partial<Column.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColumnView
  }
}
