_ = require "underscore"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"
boxpanel = require "phosphor-boxpanel"
widget = require "phosphor-widget"
messaging = require "phosphor-messaging"

class HBoxView extends ContinuumView
  #tag: "div"
  #attributes:
  #  class: "bk-hbox"

  initialize: (options) ->
    window.box = this
    @panel = new boxpanel.BoxPanel()
    @panel.direction = boxpanel.BoxPanel.LeftToRight
    @panel.node.style.width = '100%'
    @panel.node.style.height = '100%'
    @panel.node.style.position = 'absolute'
    @el.appendChild(@panel.node)
    # simulate widget.attachWidget(@panel, @el), but allow @el to be unbound to DOM
    messaging.sendMessage(@panel, widget.MSG_AFTER_ATTACH)
    
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    width = @mget("width")
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height? then @$el.css(height: height + "px")
    if true
      @panel.clearChildren()
      for child in children
        w = new widget.Widget()
        boxpanel.BoxPanel.setStretch(w, 0)
        w.node.appendChild(@views[child.id].$el[0])
        @panel.addChild(w)
      @panel.update()
    else
      @$el.empty()
      for child in children
        @$el.append(@views[child.id].$el)

    return @

class HBox extends HasParent
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