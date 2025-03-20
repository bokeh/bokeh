import {FlexBox, FlexBoxView} from "./flex_box"
import type * as p from "core/properties"

export class RowView extends FlexBoxView {
  declare model: Row
  protected _direction = "row" as const
}

export namespace Row {
  export type Attrs = p.AttrsOf<Props>
  export type Props = FlexBox.Props
}

export interface Row extends Row.Attrs {}

export class Row extends FlexBox {
  declare properties: Row.Props
  declare __view_type__: RowView

  constructor(attrs?: Partial<Row.Attrs>) {
    super(attrs)
    this.maybe_initialize(Row.__name__, attrs)
  }

  static {
    this.prototype.default_view = RowView
  }
}
