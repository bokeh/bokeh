import {Widget} from "../widget";
import {ColumnDataSource} from "../../sources/column_data_source";
import {CDSView} from "../../sources/cds_view";
import * as p from "core/properties"

export namespace TableWidget {
  export interface Attrs extends Widget.Attrs {
    source: ColumnDataSource
    view: CDSView
  }

  export interface Props extends Widget.Props {}
}

export interface TableWidget extends TableWidget.Attrs {}

export class TableWidget extends Widget {

  properties: TableWidget.Props

  constructor(attrs?: Partial<TableWidget.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "TableWidget";

    this.define({
      source: [ p.Instance ],
      view:   [ p.Instance, () => new CDSView() ],
    });
  }

  initialize(): void {
    super.initialize();

    if (this.view.source == null) {
      this.view.source = this.source;
      this.view.compute_indices();
    }
  }
}
TableWidget.initClass();
