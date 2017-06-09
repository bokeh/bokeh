import "jquery-ui/sortable"
import * as SlickGrid from "slick_grid/slick.grid"
import * as RowSelectionModel from "slick_grid/plugins/slick.rowselectionmodel"
import * as CheckboxSelectColumn from "slick_grid/plugins/slick.checkboxselectcolumn"

import * as hittest from "core/hittest"
import * as p from "core/properties"
import {uniqueId} from "core/util/string"
import {any} from "core/util/array"

import {TableWidget} from "./table_widget"
import {WidgetView} from "./widget"

export DTINDEX_NAME = "__bkdt_internal_index__"

export class DataProvider

  constructor: (@source) ->
    if DTINDEX_NAME of @source.data
      throw new Error("special name #{DTINDEX_NAME} cannot be used as a data table column")
    @index = [0...@getLength()]

  getLength: () -> @source.get_length()

  getItem: (offset) ->
    item = {}
    for field in Object.keys(@source.data)
      item[field] = @source.data[field][@index[offset]]
    item[DTINDEX_NAME] = @index[offset]
    return item

  setItem: (offset, item) ->
    for field, value of item
      # internal index is maintained independently, ignore
      if field != DTINDEX_NAME
        @source.data[field][@index[offset]] = value
    @_update_source_inplace()
    return null

  getField: (offset, field) ->
    if field == DTINDEX_NAME
      return @index[offset]
    return @source.data[field][@index[offset]]

  setField: (offset, field, value) ->
    # field assumed never to be internal index name (ctor would throw)
    @source.data[field][@index[offset]] = value
    @_update_source_inplace()
    return null

  getItemMetadata: (index) -> null

  getRecords: () ->
    return (@getItem(i) for i in [0...@getLength()])

  sort: (columns) ->
    cols = for column in columns
      [column.sortCol.field, if column.sortAsc then 1 else -1]

    if cols.length == 0
      cols = [[DTINDEX_NAME, 1]]

    records = @getRecords()
    old_index = @index.slice()

    # TODO (bev) this sort is unstable, which is not great
    @index.sort (i1, i2) ->
      for [field, sign] in cols
        value1 = records[old_index.indexOf(i1)][field]
        value2 = records[old_index.indexOf(i2)][field]
        result =
          if      value1 == value2 then 0
          else if value1 >  value2 then sign
          else                         -sign
        if result != 0
          return result
      return 0

  _update_source_inplace: () ->
    @source.properties.data.change.emit(@, @source.attributes['data'])
    return

export class DataTableView extends WidgetView
  className: "bk-data-table"

  initialize: (options) ->
    super(options)
    @in_selection_update = false

  connect_signals: () ->
    @connect(@model.change, () => @render())
    @connect(@model.source.properties.data.change, () => @updateGrid())
    @connect(@model.source.streaming, () => @updateGrid())
    @connect(@model.source.patching, () => @updateGrid())
    @connect(@model.source.properties.selected.change, () => @updateSelection())

  updateGrid: () ->
    @data.constructor(@model.source)
    @grid.invalidate()
    @grid.render()

  updateSelection: () ->
    if @in_selection_update
      return

    selected = @model.source.selected
    selected_indices = selected['1d'].indices

    permuted_indices = (@data.index.indexOf(x) for x in selected_indices)

    @in_selection_update = true
    @grid.setSelectedRows(permuted_indices)
    @in_selection_update = false
    # If the selection is not in the current slickgrid viewport, scroll the
    # datatable to start at the row before the first selected row, so that
    # the selection is immediately brought into view. We don't scroll when
    # the selection is already in the viewport so that selecting from the
    # datatable itself does not re-scroll.
    cur_grid_range = @grid.getViewport()
    if @model.scroll_to_selection and not any(permuted_indices, (i) -> cur_grid_range.top <= i <= cur_grid_range.bottom)
      min_index = Math.max(0, Math.min.apply(null, permuted_indices) - 1)
      @grid.scrollRowToTop(min_index)

  newIndexColumn: () ->
    return {
      id: uniqueId()
      name: "#"
      field: DTINDEX_NAME
      width: 40
      behavior: "select"
      cannotTriggerInsert: true
      resizable: false
      selectable: false
      sortable: true
      cssClass: "bk-cell-index"
    }

  render: () ->
    columns = (column.toColumn() for column in @model.columns)

    if @model.selectable == "checkbox"
      checkboxSelector = new CheckboxSelectColumn(cssClass: "bk-cell-select")
      columns.unshift(checkboxSelector.getColumnDefinition())

    if @model.row_headers
      columns.unshift(@newIndexColumn())

    options =
      enableCellNavigation: @model.selectable != false
      enableColumnReorder: @model.reorderable
      forceFitColumns: @model.fit_columns
      autoHeight: @model.height == "auto"
      multiColumnSort: @model.sortable
      editable: @model.editable
      autoEdit: false

    if @model.width?
      @el.style.width = "#{@model.width}px"
    else
      @el.style.width = "#{@model.default_width}px"

    if @model.height? and @model.height != "auto"
      @el.style.height = "#{@model.height}px"

    @data = new DataProvider(@model.source)
    @grid = new SlickGrid(@el, @data, columns, options)

    @grid.onSort.subscribe (event, args) =>
      columns = args.sortCols
      @data.sort(columns)
      @grid.invalidate()
      @updateSelection()
      @grid.render()

    if @model.selectable != false
      @grid.setSelectionModel(new RowSelectionModel(selectActiveRow: not checkboxSelector?))
      if checkboxSelector? then @grid.registerPlugin(checkboxSelector)

      @grid.onSelectedRowsChanged.subscribe (event, args) =>
        if @in_selection_update
          return

        selected = hittest.create_hit_test_result()
        selected['1d'].indices = (@data.index[i] for i in args.rows)
        @model.source.selected = selected

    @_prefix_ui()
    return @

export class DataTable extends TableWidget
  type: 'DataTable'
  default_view: DataTableView

  @define {
      columns:             [ p.Array,  []    ]
      fit_columns:         [ p.Bool,   true  ]
      sortable:            [ p.Bool,   true  ]
      reorderable:         [ p.Bool,   true  ]
      editable:            [ p.Bool,   false ]
      selectable:          [ p.Bool,   true  ]
      row_headers:         [ p.Bool,   true  ]
      scroll_to_selection: [ p.Bool,   true  ]
    }

  @override {
    height: 400
  }

  @internal {
    default_width:        [ p.Number, 600   ]
  }
