import {RowSelectionModel} from "@bokeh/slickgrid/plugins/slick.rowselectionmodel"
import {CheckboxSelectColumn} from "@bokeh/slickgrid/plugins/slick.checkboxselectcolumn"
import {CellExternalCopyManager} from "@bokeh/slickgrid/plugins/slick.cellexternalcopymanager"

import {Grid as SlickGrid, DataProvider} from "@bokeh/slickgrid"
import * as p from "core/properties"
import {uniqueId} from "core/util/string"
import {isString} from "core/util/types"
import {some, range} from "core/util/array"
import {keys} from "core/util/object"
import {logger} from "core/logging"
import {LayoutItem} from "core/layout"

import {TableWidget} from "./table_widget"
import {TableColumn, ColumnType, Item} from "./table_column"
import {WidgetView} from "../widget"
import {ColumnDataSource} from "../../sources/column_data_source"
import {CDSView} from "../../sources/cds_view"

import {bk_data_table, bk_cell_index, bk_header_index, bk_cell_select} from "styles/widgets/tables"

import slickgrid_css from "styles/widgets/slickgrid.css"
import tables_css from "styles/widgets/tables.css"

export const DTINDEX_NAME = "__bkdt_internal_index__"

declare const $: any

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

  getField(offset: number, field: string): any {
    // offset is the
    if (field == DTINDEX_NAME) {
      return this.index[offset]
    }
    return this.source.data[field][this.index[offset]]
  }

  setField(offset: number, field: string, value: any): void {
    // field assumed never to be internal index name (ctor would throw)
    const index = this.index[offset]
    this.source.patch({[field]: [[index, value]]})
  }

  getItemMetadata(_index: number): any {
    return null
  }

  getRecords(): Item[] {
    return range(0, this.getLength()).map((i) => this.getItem(i))
  }

  sort(columns: any[]): void {
    let cols = columns.map((column) => [column.sortCol.field, column.sortAsc ? 1 : -1])

    if (cols.length == 0) {
      cols = [[DTINDEX_NAME, 1]]
    }

    const records = this.getRecords()
    const old_index = this.index.slice()

    this.index.sort(function(i1, i2) {
      for (const [field, sign] of cols) {
        const value1 = records[old_index.indexOf(i1)][field]
        const value2 = records[old_index.indexOf(i2)][field]
        const result = value1 == value2 ? 0 : value1 > value2 ? sign : -sign
        if (result != 0)
          return result
      }
      return 0
    })
  }
}

export class DataTableView extends WidgetView {
  model: DataTable

  protected data: TableDataProvider
  protected grid: SlickGrid<Item>

  protected _in_selection_update = false
  protected _warned_not_reorderable = false

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.change, () => this.render())

    this.connect(this.model.source.streaming, () => this.updateGrid())
    this.connect(this.model.source.patching, () => this.updateGrid())
    this.connect(this.model.source.change, () => this.updateGrid())
    this.connect(this.model.source.properties.data.change, () => this.updateGrid())

    this.connect(this.model.source.selected.change, () => this.updateSelection())
    this.connect(this.model.source.selected.properties.indices.change, () => this.updateSelection())
  }

  remove(): void {
    this.grid?.destroy()
    super.remove()
  }

  styles(): string[] {
    return [...super.styles(), slickgrid_css, tables_css]
  }

  _update_layout(): void {
    this.layout = new LayoutItem()
    this.layout.set_sizing(this.box_sizing())
  }

  update_position(): void {
    super.update_position()
    this.grid.resizeCanvas()
  }

  updateGrid(): void {
    // TODO (bev) This is to ensure that CDSView indices are properly computed
    // before passing to the DataProvider. This will result in extra calls to
    // compute_indices. This "over execution" will be addressed in a more
    // general look at events
    this.model.view.compute_indices()
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
    this.grid.render()
  }

  updateSelection(): void {
    if (this._in_selection_update)
      return

    const {selected} = this.model.source

    const permuted_indices = selected.indices.map((x: number) => this.data.index.indexOf(x)).sort()

    this._in_selection_update = true
    this.grid.setSelectedRows(permuted_indices)
    this._in_selection_update = false
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
      id: uniqueId(),
      name: this.model.index_header,
      field: DTINDEX_NAME,
      width: this.model.index_width,
      behavior: "select",
      cannotTriggerInsert: true,
      resizable: false,
      selectable: false,
      sortable: true,
      cssClass: bk_cell_index,
      headerCssClass: bk_header_index,
    }
  }

  css_classes(): string[] {
    return super.css_classes().concat(bk_data_table)
  }

  render(): void {
    let checkboxSelector
    let columns: ColumnType[] = this.model.columns.map((column) => {
      return {...column.toColumn(), parent: this}
    })

    if (this.model.selectable == "checkbox") {
      checkboxSelector = new CheckboxSelectColumn({cssClass: bk_cell_select})
      columns.unshift(checkboxSelector.getColumnDefinition())
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

    let { reorderable } = this.model

    if (reorderable && !(typeof $ !== "undefined" && $.fn != null && $.fn.sortable != null)) {
      if (!this._warned_not_reorderable) {
        logger.warn("jquery-ui is required to enable DataTable.reorderable")
        this._warned_not_reorderable = true
      }
      reorderable = false
    }

    const options = {
      enableCellNavigation: this.model.selectable !== false,
      enableColumnReorder: reorderable,
      forceFitColumns: this.model.fit_columns,
      multiColumnSort: this.model.sortable,
      editable: this.model.editable,
      autoEdit: false,
      rowHeight: this.model.row_height,
    }

    this.data = new TableDataProvider(this.model.source, this.model.view)
    this.grid = new SlickGrid(this.el, this.data, columns, options)

    this.grid.onSort.subscribe((_event: any, args: any) => {
      if (!this.model.sortable)
        return
      columns = args.sortCols
      this.data.sort(columns)
      this.grid.invalidate()
      this.updateSelection()
      this.grid.render()
      if (!this.model.header_row) {
        this._hide_header()
      }
      this.model.update_sort_columns(columns)
    })

    if (this.model.selectable !== false) {
      this.grid.setSelectionModel(new RowSelectionModel({selectActiveRow: checkboxSelector == null}))
      if (checkboxSelector != null)
        this.grid.registerPlugin(checkboxSelector)

      const pluginOptions = {
        dataItemColumnValueExtractor(val: Item, col: TableColumn) {
          // As defined in this file, Item can contain any type values
          let value: any = val[col.field]
          if (isString(value)) {
            value = value.replace(/\n/g, "\\n")
          }
          return value
        },
        includeHeaderWhenCopying: false,
      }

      this.grid.registerPlugin(new CellExternalCopyManager(pluginOptions))

      this.grid.onSelectedRowsChanged.subscribe((_event: any, args: any) => {
        if (this._in_selection_update) {
          return
        }
        this.model.source.selected.indices = args.rows.map((i: number) => this.data.index[i])
      })

      this.updateSelection()

      if (!this.model.header_row) {
        this._hide_header()
      }

    }
  }

  _hide_header(): void {
    for (const el of Array.from(this.el.querySelectorAll('.slick-header-columns'))) {
      (el as HTMLElement).style.height = "0px"
    }
    this.grid.resizeCanvas()
  }
}

export namespace DataTable {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TableWidget.Props & {
    columns: p.Property<TableColumn[]>
    fit_columns: p.Property<boolean>
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
  properties: DataTable.Props
  __view_type__: DataTableView

  private _sort_columns: any[] = []
  get sort_columns(): any[] { return this._sort_columns }

  constructor(attrs?: Partial<DataTable.Attrs>) {
    super(attrs)
  }

  static init_DataTable(): void {
    this.prototype.default_view = DataTableView

    this.define<DataTable.Props>({
      columns:             [ p.Array,   []    ],
      fit_columns:         [ p.Boolean, true  ],
      sortable:            [ p.Boolean, true  ],
      reorderable:         [ p.Boolean, true  ],
      editable:            [ p.Boolean, false ],
      selectable:          [ p.Any,     true  ], // boolean or "checkbox"
      index_position:      [ p.Int,     0     ],
      index_header:        [ p.String,  "#"   ],
      index_width:         [ p.Int,     40    ],
      scroll_to_selection: [ p.Boolean, true  ],
      header_row:          [ p.Boolean, true  ],
      row_height:          [ p.Int,     25    ],
    })

    this.override({
      width: 600,
      height: 400,
    })
  }

  update_sort_columns(sortCols: any): null {
    this._sort_columns=sortCols.map((x: any) => ({field:x.sortCol.field, sortAsc:x.sortAsc}))
    return null
  }

  get_scroll_index(grid_range: {top: number, bottom: number}, selected_indices: number[]): number | null {
    if (!this.scroll_to_selection || (selected_indices.length == 0))
      return null

    if (!some(selected_indices, i => grid_range.top <= i && i <= grid_range.bottom)) {
      return Math.max(0, Math.min(...selected_indices) - 1)
    }

    return null
  }
}
