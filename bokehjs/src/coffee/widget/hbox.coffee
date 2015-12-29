_ = require "underscore"
$ = require "jquery"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
BaseBox = require "./basebox"

class HBoxView extends ContinuumView
  tag: "div"
  attributes:
    class: "bk-hbox"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    width = @mget("width")
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height? then @$el.css(height: height + "px")
    padding = @mget("padding")
    if padding? then @$el.css(padding: padding + "px")
    for child in children
      children_padding = @mget("children_padding")
      if children_padding?
        if children_padding == "auto"
          spacer = $('<div class="bk-hbox-spacer"></div>')
          @$el.append(spacer)
        else
          @views[child.id].$el.css(padding: "0 " + children_padding + "px")
      @$el.append(@views[child.id].$el)

    return @

class HBox extends BaseBox.Model
  type: "HBox"
  default_view: HBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
    }

  children: () ->
    return @get('children')

module.exports =
  Model: HBox
  View: HBoxView
