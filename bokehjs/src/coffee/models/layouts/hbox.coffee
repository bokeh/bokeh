_ = require "underscore"
$ = require "jquery"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"
BaseBox = require "./basebox"

class HBoxView extends BokehView
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

    for child, index in children
      @$el.append(@views[child.id].$el)
      if index < children.length - 1
        @$el.append($('<div class="bk-hbox-spacer"></div>'))

    return @

class HBox extends BaseBox.Model
  type: "HBox"
  default_view: HBoxView

  props: ->
    return _.extend {}, super(), {
      children: [ p.Array, [] ]
    }

  children: () ->
    return @get('children')

module.exports =
  Model: HBox
  View: HBoxView
