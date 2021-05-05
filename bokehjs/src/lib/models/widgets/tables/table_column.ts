import {CellFormatter, StringFormatter} from "./cell_formatters"
import {CellEditor, StringEditor} from "./cell_editors"
import {ColumnType} from "./definitions"

import * as p from "core/properties"
import {uniqueId} from "core/util/string"
import {Sort} from "core/enums"
import {Model} from "../../../model"

export namespace TableColumn {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    field: p.Property<string>
    title: p.Property<string | null>
    width: p.Property<number>
    formatter: p.Property<CellFormatter>
    editor: p.Property<CellEditor>
    sortable: p.Property<boolean>
    default_sort: p.Property<Sort>
  }
}

export interface TableColumn extends TableColumn.Attrs {}

export class TableColumn extends Model {
  override properties: TableColumn.Props

  constructor(attrs?: Partial<TableColumn.Attrs>) {
    super(attrs)
  }

  static init_TableColumn(): void {
    this.define<TableColumn.Props>(({Boolean, Number, String, Nullable, Ref}) => ({
      field:        [ String ],
      title:        [ Nullable(String), null ],
      width:        [ Number, 300 ],
      formatter:    [ Ref(StringFormatter), () => new StringFormatter() ],
      editor:       [ Ref(StringEditor), () => new StringEditor() ],
      sortable:     [ Boolean, true ],
      default_sort: [ Sort, "ascending" ],
    }))
  }

  toColumn(): ColumnType {
    return {
      id: uniqueId(),
      field: this.field,
      name: this.title ?? this.field,
      width: this.width,
      formatter: this.formatter != null ? this.formatter.doFormat.bind(this.formatter) : undefined,
      model: this.editor,
      editor: this.editor.default_view,
      sortable: this.sortable,
      defaultSortAsc: this.default_sort == "ascending",
    }
  }
}
