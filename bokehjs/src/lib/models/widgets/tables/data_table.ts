import {RowSelectionModel} from "@bokeh/slickgrid/plugins/slick.rowselectionmodel"
import {CheckboxSelectColumn} from "@bokeh/slickgrid/plugins/slick.checkboxselectcolumn"
import {CellExternalCopyManager} from "@bokeh/slickgrid/plugins/slick.cellexternalcopymanager"

import {Grid as SlickGrid, DataProvider, SortColumn, OnSortEventArgs, OnSelectedRowsChangedEventArgs, GridOptions} from "@bokeh/slickgrid"
import * as p from "core/properties"
import {div, StyleSheetLike} from "core/dom"
import {Arrayable} from "core/types"
import {unique_id} from "core/util/string"
import {isString, isNumber, is_defined} from "core/util/types"
import {some, range} from "core/util/array"
import {map} from "core/util/arrayable"
import {keys} from "core/util/object"
import {logger} from "core/logging"
import {DOMBoxSizing} from "../../layouts/layout_dom"

import {WidgetView} from "../widget"
import {ColumnType, Item, DTINDEX_NAME} from "./definitions"
import {TableWidget} from "./table_widget"
import {TableColumn} from "./table_column"
import {ColumnDataSource} from "../../sources/column_data_source"
import {CDSView, CDSViewView} from "../../sources/cds_view"
import {build_view, IterViews} from "core/build_views"

import tables_css, * as tables from "styles/widgets/tables.css"
import slickgrid_css from "styles/widgets/slickgrid.css"

export const AutosizeModes = {
  fit_columns: "FCV" as const,
  fit_viewport: "FVC" as const,
  force_fit: "LFF" as const,
  none: "NOA" as const,
}
export type AutosizeMode = "FCV" | "FVC" | "LFF" | "NOA"

let _warned_not_reorderable = false

export class TableDataProvider implements DataProvider<Item> {
  index: number[]
  source: ColumnDataSource
  view: CDSView

  constructor(source: ColumnDataSource, view: CDSView) {
    this.init(source, view)
  }

  init(source: ColumnDataSource, view: CDSView): void {
    if (DTINDEX_NAME in source.data)
      throw new Error(`special name ${DTINDEX_NAME} cannot be used as a data table column`)

    this.source = source
    this.view = view
    this.index = [...this.view.indices]
  }

  getLength(): number {
    return this.index.length
  }

  getItem(offset: number): Item {
    const item: Item = {}
    for (const field of keys(this.source.data)) {
      item[field] = this.source.data[field][this.index[offset]]
    }
    item[DTINDEX_NAME] = this.index[offset]
    return item
  }

  getField(offset: number, field: string): unknown {
    // offset is the
    if (field == DTINDEX_NAME) {
      return this.index[offset]
    }
    return this.source.data[field][this.index[offset]]
  }

  setField(offset: number, field: string, value: unknown): void {
    // field assumed never to be internal index name (ctor would throw)
    const index = this.index[offset]
    this.source.patch({[field]: [[index, value]]})
  }

  getRecords(): Item[] {
    return range(0, this.getLength()).map((i) => this.getItem(i))
  }

  getItems(): Item[] {
    return this.getRecords()
  }

  slice(start: number, end: number | null, step: number = 1): Item[] {
    end = end ?? this.getLength()
    return range(start, end, step).map((i) => this.getItem(i))
  }

  sort(columns: SortColumn<Item>[]): void {
    let cols = columns.map((column) => [column.sortCol.field, column.sortAsc ? 1 : -1] as const)

    if (cols.length == 0) {
      cols = [[DTINDEX_NAME, 1]]
    }

    const records = this.getRecords()
    const old_index = this.index.slice()

    this.index.sort((i0, i1) => {
      for (const [field, sign] of cols) {
        const v0 = records[old_index.indexOf(i0)][field!]
        const v1 = records[old_index.indexOf(i1)][field!]
        if (v0 === v1)
          continue
        if (isNumber(v0) && isNumber(v1)) {
          /* eslint-disable @typescript-eslint/strict-boolean-expressions */
          return sign*(v0 - v1 || +isNaN(v0) - +isNaN(v1))
        } else {
          return `${v0}` > `${v1}` ? sign : -sign
        }
      }
      return 0
    })
  }
}

export class DataTableView extends WidgetView {
  declare model: DataTable

  protected cds_view: CDSViewView

  protected data: TableDataProvider
  protected grid: SlickGrid<Item>

  protected _in_selection_update = false
  protected _width: number | null = null

  get data_source(): p.Property<ColumnDataSource> {
    return this.model.properties.source
  }

  protected wrapper_el: HTMLElement

  override *children(): IterViews {
    yield* super.children()
    yield this.cds_view
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    this.cds_view = await build_view(this.model.view, {parent: this})
  }

  override remove(): void {
    this.cds_view.remove()
    this.grid.destroy()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => {
      this.render()
      this.after_render()
      this.invalidate_layout()
    })

    for (const column of this.model.columns) {
      this.connect(column.change, () => {
        this.render()
        this.after_render()
        this.invalidate_layout()
      })
    }

    // changes to the source trigger the callback below via
    // compute_indices hooks in cds view
    // TODO reevaluate the control flow when taking a general look at events
    this.connect(this.model.view.change, () => this.updateGrid())

    this.connect(this.model.source.selected.change, () => this.updateSelection())
    this.connect(this.model.source.selected.properties.indices.change, () => this.updateSelection())
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), slickgrid_css, tables_css]
  }

  override _after_resize(): void {
    super._after_resize()
    this.grid.resizeCanvas()
    this.updateLayout(true, false)
  }

  override _after_layout(): void {
    super._after_layout()
    this.grid.resizeCanvas()
    this.updateLayout(true, false)
  }

  override box_sizing(): DOMBoxSizing {
    const sizing = super.box_sizing()
    if (this.model.autosize_mode === "fit_viewport" && this._width != null)
      sizing.width = this._width
    return sizing
  }

  updateLayout(initialized: boolean, rerender: boolean): void {
    const autosize = this.autosize
    if (autosize === AutosizeModes.fit_columns || autosize === AutosizeModes.force_fit) {
      if (!initialized)
        this.grid.resizeCanvas()
      this.grid.autosizeColumns()
    } else if (initialized && rerender && autosize === AutosizeModes.fit_viewport)
      this.invalidate_layout()
  }

  updateGrid(): void {
    this.data.init(this.model.source, this.model.view)

    // This is obnoxious but there is no better way to programmatically force
    // a re-sort on the existing sorted columns until/if we start using DataView
    if (this.model.sortable) {
      const columns = this.grid.getColumns()
      const sorters = this.grid.getSortColumns().map((x) => ({
        sortCol: {
          field: columns[this.grid.getColumnIndex(x.columnId)].field,
        },
        sortAsc: x.sortAsc,
      }))

      this.data.sort(sorters)
    }
    this.grid.invalidate()
    this.updateLayout(true, true)
  }

  updateSelection(): void {
    if (this.model.selectable === false || this._in_selection_update)
      return

    const {selected} = this.model.source

    const permuted_indices = map(selected.indices, (x) => this.data.index.indexOf(x)).sort()

    this._in_selection_update = true
    try {
      this.grid.setSelectedRows([...permuted_indices])
    } finally {
      this._in_selection_update = false
    }
    // If the selection is not in the current slickgrid viewport, scroll the
    // datatable to start at the row before the first selected row, so that
    // the selection is immediately brought into view. We don't scroll when
    // the selection is already in the viewport so that selecting from the
    // datatable itself does not re-scroll.
    const cur_grid_range = this.grid.getViewport()

    const scroll_index = this.model.get_scroll_index(cur_grid_range, permuted_indices)
    if (scroll_index != null)
      this.grid.scrollRowToTop(scroll_index)
  }

  newIndexColumn(): ColumnType {
    return {
      id: unique_id(),
      name: this.model.index_header,
      field: DTINDEX_NAME,
      width: this.model.index_width,
      behavior: "select",
      cannotTriggerInsert: true,
      resizable: false,
      selectable: false,
      sortable: true,
      cssClass: tables.cell_index,
      headerCssClass: tables.header_index,
    }
  }

  get autosize(): AutosizeMode {
    let autosize: AutosizeMode
    if (this.model.fit_columns === true)
      autosize = AutosizeModes.force_fit
    else if (this.model.fit_columns === false)
      autosize = AutosizeModes.none
    else
      autosize = AutosizeModes[this.model.autosize_mode]
    return autosize
  }

  override render(): void {
    super.render()

    this.wrapper_el = div({class: tables.data_table})
    this.shadow_el.appendChild(this.wrapper_el)
  }

  override _after_render(): void {
    super._after_render()

    const columns: ColumnType[] = this.model.columns.filter((column) => column.visible).map((column) => {
      return {...column.toColumn(), parent: this}
    })

    let checkbox_selector: CheckboxSelectColumn<Item> | null = null
    if (this.model.selectable == "checkbox") {
      checkbox_selector = new CheckboxSelectColumn({cssClass: tables.cell_select})
      columns.unshift(checkbox_selector.getColumnDefinition())
    }

    if (this.model.index_position != null) {
      const index_position = this.model.index_position
      const index = this.newIndexColumn()
      // This is to be able to provide negative index behaviour that
      // matches what python users will expect
      if (index_position == -1)
        columns.push(index)
      else if (index_position < -1)
        columns.splice(index_position+1, 0, index)
      else
        columns.splice(index_position, 0, index)
    }

    let {reorderable} = this.model

    if (reorderable && !(typeof $ != "undefined" && typeof $.fn != "undefined" && "sortable" in $.fn)) {
      if (!_warned_not_reorderable) {
        logger.warn("jquery-ui is required to enable DataTable.reorderable")
        _warned_not_reorderable = true
      }
      reorderable = false
    }

    let frozen_row = -1
    let frozen_bottom = false
    const {frozen_rows, frozen_columns} = this.model
    const frozen_column = frozen_columns == null ? -1 : frozen_columns-1
    if (frozen_rows != null) {
      frozen_bottom = frozen_rows < 0
      frozen_row = Math.abs(frozen_rows)
    }

    const options: GridOptions<Item> = {
      enableCellNavigation: this.model.selectable !== false,
      enableColumnReorder: reorderable,
      autosizeColsMode: this.autosize,
      multiColumnSort: this.model.sortable,
      editable: this.model.editable,
      autoEdit: this.model.auto_edit,
      autoHeight: false,
      rowHeight: this.model.row_height,
      frozenColumn: frozen_column,
      frozenRow: frozen_row,
      frozenBottom: frozen_bottom,
      explicitInitialization: false,
    }

    const initialized = is_defined(this.grid)

    this.data = new TableDataProvider(this.model.source, this.model.view)
    this.grid = new SlickGrid(this.wrapper_el, this.data, columns, options)

    if (this.autosize == AutosizeModes.fit_viewport) {
      this.grid.autosizeColumns()
      let width = 0
      for (const column of columns)
        width += column.width ?? 0
      this._width = Math.ceil(width)
    }

    this.grid.onSort.subscribe((_event: Event, args: OnSortEventArgs<Item>) => {
      if (!this.model.sortable)
        return
      const to_sort = args.sortCols
      if (to_sort == null)
        return
      this.data.sort(to_sort)
      this.grid.invalidate()
      this.updateSelection()
      this.grid.render()
      if (!this.model.header_row) {
        this._hide_header()
      }
      this.model.update_sort_columns(to_sort)
    })

    if (this.model.selectable !== false) {
      this.grid.setSelectionModel(new RowSelectionModel({selectActiveRow: checkbox_selector == null}))
      if (checkbox_selector != null)
        this.grid.registerPlugin(checkbox_selector)

      const pluginOptions = {
        dataItemColumnValueExtractor(val: Item, col: TableColumn) {
          // As defined in this file, Item can contain any type values
          let value = val[col.field]
          if (isString(value)) {
            value = value.replace(/\n/g, "\\n")
          }
          return value
        },
        includeHeaderWhenCopying: false,
      }

      this.grid.registerPlugin(new CellExternalCopyManager(pluginOptions))

      this.grid.onSelectedRowsChanged.subscribe((_event: Event, args: OnSelectedRowsChangedEventArgs<Item>) => {
        if (this._in_selection_update) {
          return
        }
        this.model.source.selected.indices = args.rows.map((i) => this.data.index[i])
      })

      this.updateSelection()

      if (!this.model.header_row) {
        this._hide_header()
      }
    }

    this.updateLayout(initialized, false)
  }

  _hide_header(): void {
    for (const el of this.shadow_el.querySelectorAll(".slick-header-columns")) {
      (el as HTMLElement).style.height = "0px"
    }
    this.grid.resizeCanvas()
  }
}

export namespace DataTable {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TableWidget.Props & {
    autosize_mode: p.Property<"fit_columns" | "fit_viewport" | "none" | "force_fit">
    auto_edit: p.Property<boolean>
    columns: p.Property<TableColumn[]>
    fit_columns: p.Property<boolean | null>
    frozen_columns: p.Property<number | null>
    frozen_rows: p.Property<number | null>
    sortable: p.Property<boolean>
    reorderable: p.Property<boolean>
    editable: p.Property<boolean>
    selectable: p.Property<boolean | "checkbox">
    index_position: p.Property<number | null>
    index_header: p.Property<string>
    index_width: p.Property<number>
    scroll_to_selection: p.Property<boolean>
    header_row: p.Property<boolean>
    row_height: p.Property<number>
  }
}

export interface DataTable extends DataTable.Attrs {}

export class DataTable extends TableWidget {
  declare properties: DataTable.Props
  declare __view_type__: DataTableView

  private _sort_columns: {field: string, sortAsc: boolean}[] = []
  get sort_columns(): {field: string, sortAsc: boolean}[] {
    return this._sort_columns
  }

  constructor(attrs?: Partial<DataTable.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DataTableView

    this.define<DataTable.Props>(({Array, Boolean, Int, Ref, String, Enum, Or, Nullable}) => ({
      autosize_mode:       [ Enum("fit_columns", "fit_viewport", "none", "force_fit"), "force_fit" ],
      auto_edit:           [ Boolean, false ],
      columns:             [ Array(Ref(TableColumn)), [] ],
      fit_columns:         [ Nullable(Boolean), null ],
      frozen_columns:      [ Nullable(Int), null ],
      frozen_rows:         [ Nullable(Int), null ],
      sortable:            [ Boolean, true ],
      reorderable:         [ Boolean, true ],
      editable:            [ Boolean, false ],
      selectable:          [ Or(Boolean, Enum("checkbox")), true ],
      index_position:      [ Nullable(Int), 0 ],
      index_header:        [ String, "#" ],
      index_width:         [ Int, 40 ],
      scroll_to_selection: [ Boolean, true ],
      header_row:          [ Boolean, true ],
      row_height:          [ Int, 25 ],
    }))

    this.override<DataTable.Props>({
      width: 600,
      height: 400,
    })
  }

  update_sort_columns(sort_cols: SortColumn<Item>[]): void {
    this._sort_columns = sort_cols.map(({sortCol, sortAsc}) => ({field: sortCol.field!, sortAsc}))
  }

  get_scroll_index(grid_range: {top: number, bottom: number}, selected_indices: Arrayable<number>): number | null {
    if (!this.scroll_to_selection || (selected_indices.length == 0))
      return null

    if (!some(selected_indices, i => grid_range.top <= i && i <= grid_range.bottom)) {
      return Math.max(0, Math.min(...selected_indices) - 1)
    }

    return null
  }
}
