define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class DropdownView extends continuum_view.View
    tagName: "div"
    events:
      "click": "change_input"

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      return @

  class Dropdown extends HasParent
    type: "Dropdown"
    default_view: DropdownView

    defaults: () ->
      _.extend({}, super(), {
      })

  class Dropdowns extends Backbone.Collection
    model: Dropdown

  return {
    Model: Dropdown
    Collection: new Dropdowns()
    View: DropdownView
  }
