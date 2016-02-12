_ = require "underscore"
$ = require "jquery"
bokeh_phosphor = require "bokeh_phosphor"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"

#
# div#main.p-Widget.p-Panel.p-BoxPanel.p-mod-left-to-right
#

class HBoxView extends ContinuumView
  tag: "div"
  attributes:
    class: "bk-hbox"

  initialize: (options) ->
    super(options)
    @views = {}
    @widget = new bokeh_phosphor.bokeh_phosphor.Widget()
    # @widget.attach(@el)
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    # @panel.parent = @el
    #@panel.addClass("bk-bs-container")
    # @panel.id = 'main'
    # @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.LeftToRight
    # @panel.spacing = 5

    @observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        entry = {
          mutation: mutation,
          el: mutation.target,
          oldValue: mutation.oldValue
        }
        console.log('HBOX MUTATION')
        console.log(entry)
        bokeh_phosphor.bokeh_phosphor.sendMessage(
          @widget,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @widget.layout = @panel.layout
      )
    )

    @observer.observe(@el, {subtree: true, childList: true, attributes: true} )

    @render()
    @listenTo(@model, 'change', @render)

  render: () ->

    @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.LeftToRight
    @panel.spacing = 5

    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    width = @mget("width")
    if width? then @panel.width = width #@$el.css(width: width + "px")
    height = @mget("height")
    if height? then @panel.height = height #@$el.css(height: height + "px")

    for child, index in children
      console.log("Hbox :: " + index.toString())
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget();
      child_widget.node.appendChild(@views[child.id].$el[0])
      @panel.addChild(child_widget)

    @el.appendChild(@widget.node)

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
