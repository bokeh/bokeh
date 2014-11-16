define [
  "underscore"
  "jquery"
  "common/continuum_view"
  "common/has_properties"
  "common/collection"
  "util/dom_util"
  "slick_grid/slick.grid"
  "slick_grid/plugins/slick.rowselectionmodel"
  "jquery_ui/sortable"
], (_, $, ContinuumView, HasProperties, Collection, DOMUtil, SlickGrid, RowSelectionModel, $1) ->

  class DataProvider

    constructor: (@source) ->
      @data = @source.get('data')
      @fields = _.keys(@data)

    getLength: () -> @source.get_length()

    getItem: (index) ->
      item = {}
      for field in @fields
        item[field] = @data[field][index]
      return item

    getItemMetadata: (index) -> null

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
      @grid.setSelectedRows(selected)

    render: () ->
      columns = for column in @mget("columns")
        id: _.uniqueId()
        field: column.get("field")
        name: column.get("title")
        width: column.get("width")
        #formatter: column.get("formatter")
        editor: column.get("editor").default_view

      width = @mget("width")
      height = @mget("height")

      options =
        enableCellNavigation: true
        enableColumnReorder: true
        forceFitColumns: @mget("fit_columns")
        autoHeight: height == "auto"
        editable: @mget("editable")
        autoEdit: false

      if width?
          @$el.css(width: "#{@mget("width")}px")
      if height? and height != "auto"
          @$el.css(height: "#{@mget("height")}px")

      @data = new DataProvider(@mget("source"))
      @grid = new SlickGrid(@el, @data, columns, options)
      @grid.setSelectionModel(new RowSelectionModel())

      @grid.onSelectedRowsChanged.subscribe (event, args) =>
        @mget("source").set("selected", args.rows)

  class DataTable extends HasProperties
    type: 'DataTable'
    default_view: DataTableView

    defaults: ->
      return _.extend {}, super(), {
        columns: []
        width: null
        height: 400
        fit_columns: true
        editable: false
      }

  class DataTables extends Collection
    model: DataTable

  return {
    Model: DataTable
    Collection: new DataTables()
    View: DataTableView
  }
