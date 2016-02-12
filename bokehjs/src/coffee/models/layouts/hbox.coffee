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
    # @widget = new bokeh_phosphor.bokeh_phosphor.Widget()
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    # @widget.layout = @panel.layout
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
          @panel,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @panel.update()
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
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height? then @$el.css(height: height + "px")

    for child, index in children
      console.log("Hbox :: " + index.toString())
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget();
      child_widget.node.appendChild(@views[child.id].$el[0])
      child_widget.width = @views[child.id].$el[0].width
      child_widget.height = @views[child.id].$el[0].height
      @panel.addChild(child_widget)

    @el.appendChild(@panel.node)

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
