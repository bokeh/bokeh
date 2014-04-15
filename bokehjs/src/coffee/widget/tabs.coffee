define [
  "underscore"
  "jquery"
  "backbone"
  "common/continuum_view"
  "common/has_properties"
], (_, $, Backbone, continuum_view, HasProperties) ->

  class TabsView extends continuum_view.View

    initialize : (options) ->
      super(options)
      @render()

    render: () ->
      @$el.empty()

  class Tabs extends HasProperties
    type: "Tabs"
    default_view: TabsView
    defaults: () ->
      return {
        tabs: []
        active: -1
      }

  class Tabses extends Backbone.Collection
    model: Tabs

  return {
    Model: Tabs
    Collection: new Tabses()
    View: TabsView
  }
