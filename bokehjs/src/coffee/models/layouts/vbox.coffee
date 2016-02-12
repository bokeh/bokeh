_ = require "underscore"
$ = require "jquery"
bokeh_phosphor = require "bokeh_phosphor"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"

class VBoxView extends ContinuumView
  tag: "div"
  attributes:
    class: "bk-vbox"

  initialize: (options) ->
    super(options)
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()

    @observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        # entry = {
        #   mutation: mutation,
        #   el: mutation.target,
        #   oldValue: mutation.oldValue
        # }
        # console.log('MUTATION: ')
        # console.log(entry)
        bokeh_phosphor.bokeh_phosphor.sendMessage(
          @panel,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @panel.update()
      )
    )
    @observer.observe(@el,
      {subtree: true,
      childList: true,
      attributes: true}
    )
    @views = {}

    @render()
    @listenTo(@model, 'change', @render)

  render: () ->

    @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.TopToBottom
    @panel.spacing = 5

    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    width = @mget("width")
    # if width? then panel.width = width
    if width? then @$el.css(width: width + "px")
    # height = @mget("height")
    # if height? then panel.height = height
    if height?
      @$el.css(height: height + "px")

    for child in children
      console.log("VBox")
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget()
      child_widget.node.appendChild(@views[child.id].$el[0])
      child_widget.width = @views[child.id].$el[0].width
      child_widget.height = @views[child.id].$el[0].height
      @panel.addChild(child_widget)

    @el.appendChild(@panel.node)
    return @

class VBox extends BaseBox.Model
  type: "VBox"
  default_view: VBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
    }

  children: () ->
    return @get('children')

module.exports =
  Model: VBox
  View: VBoxView
