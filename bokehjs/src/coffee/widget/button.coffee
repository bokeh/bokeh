define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, Logging) ->

  logger = Logging.logger

  class ButtonView extends continuum_view.View
    tagName: "button"
    events:
      "click": "change_input"

    change_input: () ->
      @mset('clicks', @mget('clicks') + 1)
      @model.save()

    initialize: (options) ->
      super(options)
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      @$el.empty()
      @$el.addClass("btn")
      @$el.addClass("btn-" + @mget("type"))
      if @mget("disabled") then @$el.attr("disabled", "disabled")

      @$el.text(@mget("label"))

      return @

  class Button extends HasParent
    type: "Button"
    default_view: ButtonView

    defaults: () ->
      _.extend({}, super(), {
        clicks: 0
        label: "Button"
        type: "default"
        disabled: false
      })

  class Buttons extends Backbone.Collection
    model: Button

  return {
    Model: Button
    Collection: new Buttons()
    View: ButtonView
  }
