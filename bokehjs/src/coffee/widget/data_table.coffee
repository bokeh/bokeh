define [
  "underscore"
  "jquery"
  "common/collection"
  "common/has_properties"
  "common/continuum_view"
  "slick_grid/slick.grid"
], (_, $, $$1, Collection, HasProperties, ContinuumView, SlickGrid) ->

  class DataTableView extends ContinuumView

    initialize: (options) ->
      super(options)
      @render()

  class DataTable extends HasProperties
    type: 'DataTable'
    default_view: DataTableView

    defaults: ->
      return _.extend {}, super(), {}

  class DataTables extends Collection
    model: DataTable

  return {
    Model : DataTable
    Collection: new DataTables()
    View: DataTableView
  }
