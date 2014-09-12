define [
  "underscore"
  "backbone"
  "common/continuum_view"
  "common/has_parent"
  "common/build_views"
  "common/logging"
], (_, Backbone, continuum_view, HasParent, build_views, Logging) ->

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
      @views = {}
      @render()
      @listenTo(@model, 'change', @render)

    render: () ->
      icon = @mget('icon')
      if icon?
        build_views(@views, [icon])
        for own key, val of @views
          val.$el.detach()

      @$el.empty()
      @$el.addClass("bk-bs-btn")
      @$el.addClass("bk-bs-btn-" + @mget("type"))
      if @mget("disabled") then @$el.attr("disabled", "disabled")

      label = @mget("label")
      if icon?
        @$el.append(@views[icon.id].$el)
        label = " #{label}"
      @$el.append(document.createTextNode(label))

      return @

  class Button extends HasParent
    type: "Button"
    default_view: ButtonView

    defaults: () ->
      _.extend({}, super(), {
        clicks: 0
        label: "Button"
        icon: null
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
