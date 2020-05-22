import {Column, ColumnView} from "./column"
import * as p from "core/properties"

export class WidgetBoxView extends ColumnView {
  model: WidgetBox
}

export namespace WidgetBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Column.Props
}

export interface WidgetBox extends Column.Attrs {}

export class WidgetBox extends Column {
  properties: WidgetBox.Props
  __view_type__: WidgetBoxView

  constructor(attrs?: Partial<WidgetBox.Attrs>) {
    super(attrs)
  }

  static init_WidgetBox(): void {
    this.prototype.default_view = WidgetBoxView
  }
}
