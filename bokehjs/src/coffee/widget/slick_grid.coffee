define [
  "underscore"
  "jquery"
  "common/collection"
  "common/has_properties"
  "common/continuum_view"
  "slick_grid/slick.grid"
], (_, $, $$1, Collection, HasProperties, ContinuumView, SlickGrid) ->

  class SlickGridView extends ContinuumView

    initialize: (options) ->
      super(options)
      @render()

  class SlickGrid extends HasProperties
    type: 'SlickGrid'
    default_view: SlickGridView

    defaults: ->
      return _.extend {}, super(), {}

  class SlickGrids extends Collection
    model: SlickGrid

  return {
    Model : SlickGrid
    Collection: new SlickGrids()
    View: SlickGridView
  }
