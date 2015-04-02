_ = require "underscore"
HasProperties = require "../common/has_properties"

class TableColumn extends HasProperties
  type: 'TableColumn'
  default_view: null

  defaults: () ->
    return _.extend {}, super(), {
      field: null
      title: null
      width: 300
      formatter: null
      editor: null
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