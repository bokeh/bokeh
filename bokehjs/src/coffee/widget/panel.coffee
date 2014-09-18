define [
  "underscore"
  "jquery"
  "common/collection"
  "common/continuum_view"
  "common/has_properties"
], (_, $, Collection, ContinuumView, HasProperties) ->

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
      return _.extend {}, super(), {
        title: ""
        child: null
        closable: false
      }

  class Panels extends Collection
    model: Panel

  return {
    Model: Panel
    Collection: new Panels()
    View: PanelView
  }
