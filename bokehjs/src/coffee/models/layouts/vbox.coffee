_ = require "underscore"
$ = require "jquery"
bokeh_phosphor = require "bokeh_phosphor"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"

class VBoxView extends ContinuumView

  initialize: (options) ->
    super(options)

    # Create and initialise the phosphor BoxPanel
    # for this view. VBox === TopToBottom.
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.TopToBottom
    @panel.spacing = 5

    # Inject the phosphor boxpanel's node directly into
    # backbone so that it becomes the default node for this
    # view object.
    # In this way, we save the creation of an intermediate
    # DOM node (div), which is what backbone would do by default.
    @setElement(@panel.node)

    @observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        bokeh_phosphor.bokeh_phosphor.sendMessage(
          @panel,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @render
      )
    )
    @observer.observe(@el,
      {subtree: false,
      childList: false,
      attributes: true}
    )
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
    # if width? then panel.width = width
    if width? then @$el.css(width: width + "px")
    # height = @mget("height")
    # if height? then panel.height = height
    if height? then @$el.css(height: height + "px")

    for child in children
      console.log("VBox")
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget()
      child_widget.node.appendChild(@views[child.id].$el[0])
      child_widget.node.style.width = @views[child.id].$el[0].width
      child_widget.node.style.height = @views[child.id].$el[0].height
      @panel.addChild(child_widget)

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
