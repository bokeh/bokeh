_ = require "underscore"
$ = require "jquery"
if global._bokehTest?
  $1 = undefined  # TODO Make work
  SlickGrid = undefined
  RowSelectionModel = undefined
  CheckboxSelectColumn = undefined
else
  $1 = require "jquery-ui/sortable"
  SlickGrid = require "slick_grid/slick.grid"
  RowSelectionModel = require "slick_grid/plugins/slick.rowselectionmodel"
  CheckboxSelectColumn = require "slick_grid/plugins/slick.checkboxselectcolumn"
ContinuumView = require "../common/continuum_view"
HasProperties= require "../common/has_properties"
DOMUtil = require "../util/dom_util"
hittest = require "../common/hittest"

class DataProvider

  constructor: (@source) ->
    @data = @source.get('data')
    @fields = _.keys(@data)

    if not _.contains(@fields, "index")
      @data["index"] = [0...@getLength()]
      @fields.push("index")

  getLength: () -> @source.get_length()

  getItem: (index) ->
    item = {index: index}
    for field in @fields
      item[field] = @data[field][index]
    return item

  _setItem: (index, item) ->
    for field, value of item
      @data[field][index] = value
    return

  setItem: (index, item) ->
    @_setItem(index, item)
    @updateSource()

  getField: (index, field) ->
    return @data[field][index]

  _setField: (index, field, value) ->
    @data[field][index] = value
    return

  setField: (index, field, value) ->
    @_setField(index, field, value)
    @updateSource()

  updateSource: () ->
    # XXX: We should say `@source.set('data', @data)`, but data was updated in-place,
    # so that would be a no-op. We have to trigger change events manually instead.
    @source.forceTrigger("data")

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

class DataTableView extends ContinuumView
  attributes:
    class: "bk-data-table"

  initialize: (options) ->
    super(options)
    DOMUtil.waitForElement(@el, () => @render())
    @listenTo(@model, 'change', () => @render())
    source = @mget("source")
    @listenTo(source, 'change:data', () => @updateGrid())
    @listenTo(source, 'change:selected', () => @updateSelection())

  updateGrid: () ->
    @data = new DataProvider(@mget("source"))
    @grid.setData(@data)
    @grid.render()

  updateSelection: () ->
    selected = @mget("source").get("selected")
    @grid.setSelectedRows(selected['1d'].indices)

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
    columns = (column.toColumn() for column in @mget("columns"))

    if @mget("selectable") == "checkbox"
      checkboxSelector = new CheckboxSelectColumn(cssClass: "bk-cell-select")
      columns.unshift(checkboxSelector.getColumnDefinition())

    if @mget("row_headers") and @mget("source").get_column("index")?
      columns.unshift(@newIndexColumn())

    width = @mget("width")
    height = @mget("height")

    options =
      enableCellNavigation: @mget("selectable") != false
      enableColumnReorder: true
      forceFitColumns: @mget("fit_columns")
      autoHeight: height == "auto"
      multiColumnSort: @mget("sortable")
      editable: @mget("editable")
      autoEdit: false

    if width?
      @$el.css(width: "#{@mget("width")}px")
    if height? and height != "auto"
      @$el.css(height: "#{@mget("height")}px")

    @data = new DataProvider(@mget("source"))
    @grid = new SlickGrid(@el, @data, columns, options)

    @grid.onSort.subscribe (event, args) =>
      columns = args.sortCols
      @data.sort(columns)
      @grid.invalidate()
      @grid.render()

    if @mget("selectable") != false
      @grid.setSelectionModel(new RowSelectionModel(selectActiveRow: not checkboxSelector?))
      if checkboxSelector? then @grid.registerPlugin(checkboxSelector)

      @grid.onSelectedRowsChanged.subscribe (event, args) =>
        selected = hittest.create_hit_test_result()
        selected['1d'].indices = args.rows
        @mget("source").set("selected", selected)

    return @

class DataTable extends HasProperties
  type: 'DataTable'
  default_view: DataTableView

  defaults: () ->
    return _.extend {}, super(), {
      columns: []
      width: null
      height: 400
      fit_columns: true
      sortable: true
      editable: false
      selectable: true
      row_headers: true
    }

module.exports =
  Model: DataTable
  View: DataTableView