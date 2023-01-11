import {Placeholder, PlaceholderView} from "./placeholder"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Index as DataIndex} from "core/util/templating"
import * as p from "core/properties"

export class IndexView extends PlaceholderView {
  declare model: Index

  update(_source: ColumnarDataSource, i: DataIndex | null, _vars: object/*, formatters?: Formatters*/): void {
    this.el.textContent = i == null ? "(null)" : i.toString()
  }
}

export namespace Index {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props
}

export interface Index extends Index.Attrs {}

export class Index extends Placeholder {
  declare properties: Index.Props
  declare __view_type__: IndexView

  constructor(attrs?: Partial<Index.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = IndexView
  }
}
