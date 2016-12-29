import * as _ from "underscore"
import * as $ from "jquery"
import "jquery-ui/sortable"
import * as SlickGrid from "slick_grid/slick.grid"
import * as RowSelectionModel from "slick_grid/plugins/slick.rowselectionmodel"
import * as CheckboxSelectColumn from "slick_grid/plugins/slick.checkboxselectcolumn"

import * as hittest from "../../core/hittest"
import * as p from "../../core/properties"

import {TableWidget} from "./table_widget"
import {WidgetView} from "./widget"

wait_for_element = (el, fn) ->
  handler = () =>
    if $.contains(document.documentElement, el)
      clearInterval(interval)
      fn()
  interval = setInterval(handler, 50)

export class DataProvider

  constructor: (@source) ->
    @data = @source.data
    @fields = _.keys(@data)

    if not _.contains(@fields, "index")
      @data["index"] = [0...@getLength()]
      @fields.push("index")

  getLength: () -> @source.get_length()

  getItem: (offset) ->
    item = {}
    for field in @fields
      item[field] = @data[field][offset]
    return item

  _setItem: (offset, item) ->
    for field, value of item
      @data[field][offset] = value
    return

  setItem: (offset, item) ->
    @_setItem(offset, item)
    @updateSource()

  getField: (index, field) ->
    offset = @data["index"].indexOf(index)
    return @data[field][offset]

  _setField: (index, field, value) ->
    offset = @data["index"].indexOf(index)
    @data[field][offset] = value
    return

  setField: (index, field, value) ->
    @_setField(index, field, value)
    @updateSource()

  updateSource: () ->
    # XXX: We should say `@source.data = @data`, but data was updated in-place,
    # so that would be a no-op. We have to trigger change events manually instead.
    @source.trigger("change:data", @, @source.attributes['data'])

  getItemMetadata: (index) -> null

  getRecords: () ->
    return (@getItem(i) for i in [0...@getLength()])

  sort: (columns) ->
    cols = for column in columns
      [column.sortCol.field, if column.sortAsc then 1 else -1]

    if _.isEmpty(cols)
      cols = [["index", 1]]

    records = @getRecords()
    records.sort (record1, record2) ->
      for [field, sign] in cols
        value1 = record1[field]
        value2 = record2[field]
        result =
          if      value1 == value2 then 0
          else if value1 >  value2 then sign
          else                         -sign
        if result != 0
          return result

      return 0

    for record, i in records
      @_setItem(i, record)

    @updateSource()

export class DataTableView extends WidgetView
  className: "bk-data-table"

  initialize: (options) ->
    super(options)
    wait_for_element(@el, () => @render())
    @listenTo(@model, 'change', () => @render())
    source = @model.source
    @listenTo(source, 'change:data', () => @updateGrid())
    @listenTo(source, 'change:selected', () => @updateSelection())

  updateGrid: () ->
    @data.constructor(@model.source)
    @grid.invalidate()
    @grid.render()

    # XXX: Workaround for `@model.source.trigger('change')` not triggering an event within python.
    # But we still need it to trigger render updates
    @model.source.data = @model.source.data
    @model.source.trigger('change')

  updateSelection: () ->
    selected = @model.source.selected
    indices = selected['1d'].indices
    @grid.setSelectedRows(indices)
    # If the selection is not in the current slickgrid viewport, scroll the
    # datatable to start at the row before the first selected row, so that
    # the selection is immediately brought into view. We don't scroll when
    # the selection is already in the viewport so that selecting from the
    # datatable itself does not re-scroll.
    # console.log("DataTableView::updateSelection",
    #             @grid.getViewport(), @grid.getRenderedRange())
    cur_grid_range = @grid.getViewport()
    if @model.scroll_to_selection and not _.any(indices, (i) -> cur_grid_range.top <= i <= cur_grid_range.bottom)
      # console.log("DataTableView::updateSelection", min_index, indices)
      min_index = Math.max(0, Math.min.apply(null, indices) - 1)
      @grid.scrollRowToTop(min_index)

  newIndexColumn: () ->
    return {
      id: _.uniqueId()
      name: "#"
      field: "index"
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

    if @model.row_headers and @model.source.get_column("index")?
      columns.unshift(@newIndexColumn())

    width = @model.width
    height = @model.height

    options =
      enableCellNavigation: @model.selectable != false
      enableColumnReorder: true
      forceFitColumns: @model.fit_columns
      autoHeight: height == "auto"
      multiColumnSort: @model.sortable
      editable: @model.editable
      autoEdit: false

    if width?
      @$el.css(width: "#{@model.width}px")
    else
      @$el.css(width: "#{@model.default_width}px")
    if height? and height != "auto"
      @$el.css(height: "#{@model.height}px")

    @data = new DataProvider(@model.source)
    @grid = new SlickGrid(@el, @data, columns, options)

    @grid.onSort.subscribe (event, args) =>
      columns = args.sortCols
      @data.sort(columns)
      @grid.invalidate()
      @grid.render()

    if @model.selectable != false
      @grid.setSelectionModel(new RowSelectionModel(selectActiveRow: not checkboxSelector?))
      if checkboxSelector? then @grid.registerPlugin(checkboxSelector)

      @grid.onSelectedRowsChanged.subscribe (event, args) =>
        selected = hittest.create_hit_test_result()
        selected['1d'].indices = args.rows
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
