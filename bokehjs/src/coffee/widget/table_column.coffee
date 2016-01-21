_ = require "underscore"
Model = require "../model/model"
CellEditors = require "./cell_formatters"
CellFormatters = require "./cell_formatters"

class TableColumn extends Model
  type: 'TableColumn'
  default_view: null

  defaults: () ->
    return _.extend {}, super(), {
      field: null
      title: null
      width: 300
      formatter: new CellFormatters.String.Model()
      editor: new CellEditors.String.Model()
      sortable: true
      default_sort: "ascending"
    }

  toColumn: () ->
    return {
      id: _.uniqueId()
      field: @get("field")
      name: @get("title")
      width: @get("width")
      formatter: @get("formatter")
      editor: @get("editor")
      sortable: @get("sortable")
      defaultSortAsc: @get("default_sort") == "ascending"
    }

module.exports =
  Model: TableColumn
