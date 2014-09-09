define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class CheckboxButtonGroupView extends continuum_view.View

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class CheckboxButtonGroup extends HasParent
    type: "CheckboxButtonGroup"
    default_view: CheckboxButtonGroupView

    defaults: () ->
      _.extend({}, super(), {
      })

  class CheckboxButtonGroups extends Backbone.Collection
    model: CheckboxButtonGroup

  return {
    Model: CheckboxButtonGroup
    Collection: new CheckboxButtonGroups()
    View: CheckboxButtonGroupView
  }
