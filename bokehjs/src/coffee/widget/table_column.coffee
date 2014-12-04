define [
  "underscore"
  "common/has_properties"
  "common/collection"
], (_, HasProperties, Collection) ->

  class TableColumn extends HasProperties
    type: 'TableColumn'
    default_view: null

    defaults: ->
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

  class TableColumns extends Collection
    model: TableColumn

  return {
    Model: TableColumn
    Collection: new TableColumns()
  }
