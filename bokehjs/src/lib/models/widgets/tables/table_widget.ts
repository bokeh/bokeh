import {Widget} from "../widget"
import {ColumnDataSource} from "../../sources/column_data_source"
import {CDSView} from "../../sources/cds_view"
import * as p from "core/properties"

export namespace TableWidget {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Widget.Props & {
    source: p.Property<ColumnDataSource>
    view: p.Property<CDSView>
  }
}

export interface TableWidget extends TableWidget.Attrs {}

export class TableWidget extends Widget {
  properties: TableWidget.Props

  constructor(attrs?: Partial<TableWidget.Attrs>) {
    super(attrs)
  }

  static init_TableWidget(): void {
    this.define<TableWidget.Props>(({Ref}) => ({
      source: [ Ref(ColumnDataSource), () => new ColumnDataSource() ],
      view:   [ Ref(CDSView), () => new CDSView() ],
    }))
  }

  initialize(): void {
    super.initialize()

    if (this.view.source == null) {
      this.view.source = this.source
      this.view.compute_indices()
    }
  }
}
