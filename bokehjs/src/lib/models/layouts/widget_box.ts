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

  constructor(attrs?: Partial<WidgetBox.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "WidgetBox"
    this.prototype.default_view = WidgetBoxView
  }
}
WidgetBox.initClass()
