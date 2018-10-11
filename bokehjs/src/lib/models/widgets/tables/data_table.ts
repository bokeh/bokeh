const {Grid: SlickGrid} = require("slickgrid")
type SlickGrid = typeof SlickGrid

const {RowSelectionModel} = require("slickgrid/plugins/slick.rowselectionmodel")
const {CheckboxSelectColumn} = require("slickgrid/plugins/slick.checkboxselectcolumn")

import * as p from "core/properties"
import {uniqueId} from "core/util/string"
import {any, range} from "core/util/array"
import {keys} from "core/util/object"
import {logger} from "core/logging"

import {TableWidget} from "./table_widget"
import {Column, TableColumn} from "./table_column"
import {WidgetView} from "../widget"
import {ColumnDataSource, Index} from "../../sources/column_data_source"
import {CDSView} from "../../sources/cds_view"

export const DTINDEX_NAME = "__bkdt_internal_index__"

declare var $: any

export type Item = {[key: string]: any}

export class DataProvider {

  readonly index: number[]

  constructor(readonly source: ColumnDataSource, readonly view: CDSView) {
    if (DTINDEX_NAME in this.source.data)
      throw new Error(`special name ${DTINDEX_NAME} cannot be used as a data table column`)

    this.index = this.view.indices
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
    const patches: {[key: string]: [Index, any][]} = {}
    const index = this.index[offset]
    patches[field] =  [ [index, value] ]
    this.source.patch(patches)
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

  private data: DataProvider
  private grid: SlickGrid

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

  updateGrid(): void {
    // TODO (bev) This is to ensure that CDSView indices are properly computed
    // before passing to the DataProvider. This will result in extra calls to
    // compute_indices. This "over execution" will be addressed in a more
    // general look at events
    this.model.view.compute_indices()
    this.data.constructor(this.model.source, this.model.view)

    // This is obnoxious but there is no better way to programmatically force
    // a re-sort on the existing sorted columns until/if we start using DataView
    const columns = this.grid.getColumns()
    const sorters = this.grid.getSortColumns().map((x: any) => ({
      sortCol: {
        field: columns[this.grid.getColumnIndex(x.columnId)].field,
      },
      sortAsc: x.sortAsc,
    }))
    this.data.sort(sorters)

    this.grid.invalidate()
    this.grid.render()
  }

  updateSelection(): void {
    if (this._in_selection_update)
      return

    const {selected} = this.model.source

    const permuted_indices = selected.indices.map((x: number) => this.data.index.indexOf(x))

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

  newIndexColumn(): Column {
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
      cssClass: "bk-cell-index",
      headerCssClass: "bk-header-index",
    }
  }

  css_classes(): string[] {
    return super.css_classes().concat("bk-data-table")
  }

  render(): void {
    let checkboxSelector
    let columns = this.model.columns.map((column) => column.toColumn())

    if (this.model.selectable == "checkbox") {
      checkboxSelector = new CheckboxSelectColumn({cssClass: "bk-cell-select"})
      columns.unshift(checkboxSelector.getColumnDefinition())
    }

    if (this.model.index_position != null) {
      const index_position = this.model.index_position
      const index = this.newIndexColumn()
      // This is to be able to provide negative index behaviour that
      // matches what python users will expect
      if (index_position == -1) {
        columns.push(index)
      }
      else if (index_position < -1) {
        columns.splice(index_position+1, 0, index)
      }
      else {
        columns.splice(index_position, 0, index)
      }
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
      autoHeight: (this.model.height as any) == "auto",
      multiColumnSort: this.model.sortable,
      editable: this.model.editable,
      autoEdit: false,
    }

    if (this.model.width != null)
      this.el.style.width = `${this.model.width}px`
    else
      this.el.style.width = `${this.model.default_width}px`

    if (this.model.height != null && (this.model.height as any) != "auto")
      this.el.style.height = `${this.model.height}px`

    this.data = new DataProvider(this.model.source, this.model.view)
    this.grid = new SlickGrid(this.el, this.data, columns, options)

    this.grid.onSort.subscribe((_event: any, args: any) => {
      columns = args.sortCols
      this.data.sort(columns)
      this.grid.invalidate()
      this.updateSelection()
      this.grid.render()
      if (!this.model.header_row) {
        this._hide_header()
      }
    })

    if (this.model.selectable !== false) {
      this.grid.setSelectionModel(new RowSelectionModel({selectActiveRow: checkboxSelector == null}))
      if (checkboxSelector != null)
        this.grid.registerPlugin(checkboxSelector)

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
  export interface Attrs extends TableWidget.Attrs {
    columns: TableColumn[]
    fit_columns: boolean
    sortable: boolean
    reorderable: boolean
    editable: boolean
    selectable: boolean | "checkbox"
    index_position: number | null
    index_header: string
    index_width: number
    scroll_to_selection: boolean
    header_row: boolean
  }

  export interface Props extends TableWidget.Props {}
}

export interface DataTable extends DataTable.Attrs {}

export class DataTable extends TableWidget {

  properties: DataTable.Props

  constructor(attrs?: Partial<DataTable.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'DataTable'
    this.prototype.default_view = DataTableView

    this.define({
      columns:             [ p.Array,  []    ],
      fit_columns:         [ p.Bool,   true  ],
      sortable:            [ p.Bool,   true  ],
      reorderable:         [ p.Bool,   true  ],
      editable:            [ p.Bool,   false ],
      selectable:          [ p.Any,    true  ], // boolean or "checkbox"
      index_position:      [ p.Int,    0     ],
      index_header:        [ p.String, "#"   ],
      index_width:         [ p.Int,    40    ],
      scroll_to_selection: [ p.Bool,   true  ],
      header_row:          [ p.Bool,   true  ],
    })

    this.override({
      height: 400,
    })
  }

  readonly default_width = 600

  get_scroll_index(grid_range: {top: number, bottom: number}, selected_indices: number[]): number | null {
    if (!this.scroll_to_selection || (selected_indices.length == 0))
      return null

    if (!any(selected_indices, i => grid_range.top <= i && i <= grid_range.bottom)) {
      return Math.max(0, Math.min(...selected_indices) - 1)
    }

    return null
  }
}
DataTable.initClass()
