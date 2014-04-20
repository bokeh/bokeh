define [
  "underscore"
  "jquery"
  "handsontable"
  "backbone"
  "common/has_properties"
  "common/continuum_view"
], (_, $, $$1, Backbone, HasProperties, ContinuumView) ->

  class HandsonTableView extends ContinuumView.View
    initialize: (options) ->
      super(options)

  class HandsonTable extends HasProperties
    type: 'HandsonTable'
    default_view: HandsonTableView

    defaults: () ->
      return {}

  class HandsonTables extends Backbone.Collection
    model: HandsonTable

  return {
    Model : HandsonTable
    Collection: new HandsonTables()
    View: HandsonTableView
  }
