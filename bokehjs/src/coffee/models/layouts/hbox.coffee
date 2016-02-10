_ = require "underscore"
$ = require "jquery"
Widget = require("bokeh_phosphor").Widget
Layout = require("bokeh_phosphor").Layout
BoxPanel = require("bokeh_phosphor").BoxPanel
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
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
    @widget = new Widget()
    @layout = new BoxPanel()

  render: () ->
    #
    # console.log @widget
    # console.log @layout
    # console.log BoxPanel
    # console.log new BoxPanel()

    @layout = new BoxPanel()
    @layout.direction = bokeh_phosphor.BoxPanel.LeftToRight
    @layout.spacing = 5

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
      child_widget = new Widget();
      child_widget.node.addChild(@views[child.id].$el)
      @layout.addChild(child_widget)

    @widget.layout = @layout

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
