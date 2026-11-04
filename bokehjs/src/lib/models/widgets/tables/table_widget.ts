import {Widget} from "../widget"
import {ColumnDataSource} from "../../sources/column_data_source"
import {IndexedView} from "../../sources/indexed_view"
import type * as p from "core/properties"

export namespace TableWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    source: p.Property<ColumnDataSource>
    view: p.Property<IndexedView>
  }
}

export interface TableWidget extends TableWidget.Attrs {}

export class TableWidget extends Widget {
  declare properties: TableWidget.Props

  static {
    this.define<TableWidget.Props>(({Ref}) => ({
      source: [ Ref(ColumnDataSource), () => ColumnDataSource.create() ],
      view:   [ Ref(IndexedView), () => IndexedView.create() ],
    }))
  }
}
