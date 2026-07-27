import {CellFormatter, StringFormatter} from "./cell_formatters"
import {CellEditor, StringEditor} from "./cell_editors"
import type {ColumnType} from "./definitions"
import type {EditorConstructor} from "slickgrid"

import type * as p from "core/properties"
import {unique_id, escape} from "core/util/string"
import {isString} from "core/util/types"
import {span, parse_html_fragment} from "core/dom"
import {Sort} from "core/enums"
import {Comparison} from "../../../models/comparisons"
import {Model} from "../../../model"
import {HTML} from "../../dom/html"

export namespace TableColumn {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    field: p.Property<string>
    title: p.Property<string | HTML | null>
    width: p.Property<number>
    formatter: p.Property<CellFormatter>
    editor: p.Property<CellEditor>
    sortable: p.Property<boolean>
    default_sort: p.Property<Sort>
    visible: p.Property<boolean>
    sorter: p.Property<Comparison | null>
  }
}

export interface TableColumn extends TableColumn.Attrs {}

export class TableColumn extends Model {
  declare properties: TableColumn.Props

  constructor(attrs?: Partial<TableColumn.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TableColumn.Props>(({Bool, Float, Str, Nullable, Or, Ref}) => ({
      field:              [ Str ],
      title:              [ Nullable(Or(Str, Ref(HTML))), null ],
      width:              [ Float, 300 ],
      formatter:          [ Ref(CellFormatter), () => new StringFormatter() ],
      editor:             [ Ref(CellEditor), () => new StringEditor() ],
      sortable:           [ Bool, true ],
      default_sort:       [ Sort, "ascending" ],
      visible:            [ Bool, true ],
      sorter:             [ Nullable(Ref(Comparison)), null ],
    }))
  }

  protected _title_name(): string | HTMLElement {
    const {title, field} = this

    if (title == null) {
      return escape(field)
    } else if (isString(title)) {
      return escape(title)
    } else if (isString(title.html)) {
      // HTML(html="...") with a raw string -> parse into real DOM nodes
      const el = span()
      el.append(...parse_html_fragment(title.html))
      return el
    } else {
      return escape(field)
    }
  }

  toColumn(): ColumnType {
    return {
      id: unique_id(),
      field: this.field,
      name: this._title_name(),
      width: this.width,
      formatter: this.formatter.doFormat.bind(this.formatter),
      model: this.editor,
      editor: this.editor.default_view as unknown as EditorConstructor,
      sortable: this.sortable,
      defaultSortAsc: this.default_sort == "ascending",
      sorter: this.sorter,
    }
  }
}
