import {CellFormatter, StringFormatter} from "./cell_formatters"
import {CellEditor, StringEditor} from "./cell_editors"
import type {ColumnType} from "./definitions"
import type {EditorConstructor} from "slickgrid"

import type * as p from "core/properties"
import {unique_id, escape} from "core/util/string"
import {isString} from "core/util/types"
import {Sort} from "core/enums"
import {Comparison} from "../../../models/comparisons"
import type {HTMLView} from "../../dom/html"
import {HTML} from "../../dom/html"
import type {DOMView} from "core/dom_view"
import type {ChildView} from "core/build_views"
import {build_view} from "core/build_views"
import {View} from "core/view"
import {Model} from "../../../model"

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

export class TableColumnView extends View {
  declare model: TableColumn
  declare readonly parent: DOMView

  title_view?: HTMLView

  protected override _children_views(): ChildView[] {
    return [...super._children_views(), this.title_view]
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this._update_title_view()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {title} = this.model.properties
    this.on_change(title, async () => {
      await this._update_title_view()
      this.parent.rerender()
    })
  }

  protected async _update_title_view(): Promise<void> {
    this.title_view?.remove()
    this.title_view = undefined

    const {title} = this.model
    if (title instanceof HTML) {
      this.title_view = await build_view(title, {parent: this.parent})
      this.title_view.render()
    }
  }

  protected _title_name(): string | HTMLElement {
    const {title, field} = this.model

    if (title == null) {
      return escape(field)
    } else if (isString(title)) {
      return escape(title)
    } else if (this.title_view != null) {
      return this.title_view.el
    } else {
      return escape(field)
    }
  }

  toColumn(): ColumnType {
    const {model} = this
    return {
      id: unique_id(),
      field: model.field,
      name: this._title_name(),
      width: model.width,
      formatter: model.formatter.doFormat.bind(model.formatter),
      model: model.editor,
      editor: model.editor.default_view as unknown as EditorConstructor,
      sortable: model.sortable,
      defaultSortAsc: model.default_sort == "ascending",
      sorter: model.sorter,
    }
  }
}

export class TableColumn extends Model {
  declare properties: TableColumn.Props
  declare __view_type__: TableColumnView

  static {
    this.prototype.default_view = TableColumnView

    this.define<TableColumn.Props>(({Bool, Float, Str, Nullable, Ref, Or}) => ({
      field:        [ Str ],
      title:        [ Nullable(Or(Str, Ref(HTML))), null ],
      width:        [ Float, 300 ],
      formatter:    [ Ref(CellFormatter), () => StringFormatter.create() ],
      editor:       [ Ref(CellEditor), () => StringEditor.create() ],
      sortable:     [ Bool, true ],
      default_sort: [ Sort, "ascending" ],
      visible:      [ Bool, true ],
      sorter:       [ Nullable(Ref(Comparison)), null ],
    }))
  }
}
