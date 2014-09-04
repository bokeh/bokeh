define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class RadioButtonsView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class RadioButtons extends HasParent
    type: "RadioButtons"
    default_view: RadioButtonsView

    defaults: () -> {
    }

  class RadioButtonss extends Backbone.Collection
    model: RadioButtons

  return {
    Model: RadioButtons
    Collection: new RadioButtonss()
    View: RadioButtonsView
  }
