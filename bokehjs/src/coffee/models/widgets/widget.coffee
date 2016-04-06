LayoutComponent = require "../layouts/layout_component"
BokehView = require "../../core/bokeh_view"

class WidgetView extends BokehView
  className: "bk-widget"

  initialize: () ->
    @bind_bokeh_events()
    @resize()

  resize: () ->
    console.log('resizing slider')
    width = @model._width._value
    height = @model._height._value

    # Set the DOM Box
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: width
      height: height
    })

  bind_bokeh_events: () ->
    @listenTo(@model.document.solver(), 'resize', @resize)

class Widget extends LayoutComponent.Model
  type: "Widget"
  default_view: WidgetView

  get_constrained_variables: () ->
    {
      'width' : @_width,
      'height' : @_height
    }

  set_dom_origin: (left, top) ->
    @set({ dom_left: left, dom_top: top })

  variables_updated: () ->
    @trigger('change')


module.exports =
  Model: Widget
  View: WidgetView
