define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class RadioGroupView extends continuum_view.View
    tagName: "div"

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      @$el.addClass("radio")
      return @

  class RadioGroup extends HasParent
    type: "RadioGroup"
    default_view: RadioGroupView

    defaults: () ->
      _.extend({}, super(), {
      })

  class RadioGroups extends Backbone.Collection
    model: RadioGroup

  return {
    Model: RadioGroup
    Collection: new RadioGroups()
    View: RadioGroupView
  }
