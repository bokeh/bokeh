define [
  "underscore"
  "jquery"
  "common/collection"
  "common/has_properties"
], (_, $, Collection, HasProperties) ->

  class TableColumn extends HasProperties
    type: 'TableColumn'
    default_view: null

  class TableColumns extends Collection
    model: TableColumn

  return {
    Model : TableColumn
    Collection: new TableColumns()
  }
