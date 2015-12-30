_ = require "underscore"
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
    css_classes = @model.css_classes()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()

    for css_class in css_classes
      @$el.addClass(css_class)

    width = @mget("width")
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height? then @$el.css(height: height + "px")
    for child in children
      @$el.append(@views[child.id].$el)

    return @

class HBox extends BaseBox.Model
  type: "HBox"
  default_view: HBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
      css_classes: []
    }

  children: () ->
    return @get('children')

  css_classes: () ->
    return @get('css_classes')

module.exports =
  Model: HBox
  View: HBoxView
