define [
  "underscore"
  "jquery"
  "backbone"
  "common/continuum_view"
  "common/has_properties"
], (_, $, Backbone, continuum_view, HasProperties) ->

  class PanelView extends continuum_view.View

    initialize : (options) ->
      super(options)
      @render()

    render: () ->
      @$el.empty()

  class Panel extends HasProperties
    type: "Panel"
    default_view: PanelView
    defaults: ->
      _.extend {}, super(), {
        title: ""
        child: null
        closable: false
      }

  class Panels extends Backbone.Collection
    model: Panel

  return {
    Model: Panel
    Collection: new Panels()
    View: PanelView
  }
