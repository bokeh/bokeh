define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class CheckboxGroupView extends continuum_view.View
    tagName: "div"

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      @$el.addClass("checkbox")
      return @

  class CheckboxGroup extends HasParent
    type: "CheckboxGroup"
    default_view: CheckboxGroupView

    defaults: () ->
      _.extend({}, super(), {
      })

  class CheckboxGroups extends Backbone.Collection
    model: CheckboxGroup

  return {
    Model: CheckboxGroup
    Collection: new CheckboxGroups()
    View: CheckboxGroupView
  }
