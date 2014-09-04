define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class ToggleView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class Toggle extends HasParent
    type: "Toggle"
    default_view: ToggleView

    defaults: () -> {
    }

  class Toggles extends Backbone.Collection
    model: Toggle

  return {
    Model: Toggle
    Collection: new Toggles()
    View: ToggleView
  }
