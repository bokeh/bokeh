define [
  "common/has_properties"
  "common/collection"
], (HasProperties, Collection) ->

  class TableColumn extends HasProperties
    type: 'TableColumn'
    default_view: null

  class TableColumns extends Collection
    model: TableColumn

  return {
    Model: TableColumn
    Collection: new TableColumns()
  }
