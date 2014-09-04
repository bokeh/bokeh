define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class CheckboxButtonsView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class CheckboxButtons extends HasParent
    type: "CheckboxButtons"
    default_view: CheckboxButtonsView

    defaults: () -> {
    }

  class CheckboxButtonss extends Backbone.Collection
    model: CheckboxButtons

  return {
    Model: CheckboxButtons
    Collection: new CheckboxButtonss()
    View: CheckboxButtonsView
  }
