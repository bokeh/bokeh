define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class RadioButtonGroupView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class RadioButtonGroup extends HasParent
    type: "RadioButtonGroup"
    default_view: RadioButtonGroupView

    defaults: () ->
      _.extend({}, super(), {
      })

  class RadioButtonGroups extends Backbone.Collection
    model: RadioButtonGroup

  return {
    Model: RadioButtonGroup
    Collection: new RadioButtonGroups()
    View: RadioButtonGroupView
  }
