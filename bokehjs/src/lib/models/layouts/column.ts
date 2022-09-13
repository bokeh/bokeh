import {FlexBox, FlexBoxView} from "./flex_box"
import * as p from "core/properties"

export class ColumnView extends FlexBoxView {
  override model: Column
  protected _direction = "column" as const
}

export namespace Column {
  export type Attrs = p.AttrsOf<Props>
  export type Props = FlexBox.Props
}

export interface Column extends Column.Attrs {}

export class Column extends FlexBox {
  override properties: Column.Props
  override __view_type__: ColumnView

  constructor(attrs?: Partial<Column.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ColumnView
  }
}
