define [
  "underscore"
  "jquery"
  "backbone"
  "common/has_properties"
], (_, $, Backbone, HasProperties) ->

  class TableColumn extends HasProperties
    type: 'TableColumn'
    default_view: null

  class TableColumns extends Backbone.Collection
    model: TableColumn

  return {
    Model : TableColumn
    Collection: new TableColumns()
  }
