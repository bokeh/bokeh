define [
  "underscore"
  "jquery"
  "backbone"
  "common/continuum_view"
  "common/has_properties"
], (_, $, Backbone, ContinuumView, HasProperties) ->

  class PanelView extends ContinuumView

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
