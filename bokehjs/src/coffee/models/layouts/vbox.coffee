_ = require "underscore"
$ = require "jquery"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"


class VBoxView extends ContinuumView

  initialize: (options) ->
    super(options)


    # Create and initialise the phosphor BoxPanel
    # for this view. VBox === TopToBottom.
    @panel = new window.bokeh_phosphor.BoxPanel()
    @panel.direction = window.bokeh_phosphor.BoxPanel.TopToBottom
    @panel.spacing = 5
    window.onresize = => @panel.update();

    # Inject the phosphor boxpanel's node directly into
    # backbone so that it becomes the default node for this
    # view object.
    # In this way, we save the creation of an intermediate
    # DOM node (div), which is what backbone would do by default.
    @setElement(@panel.node)
    @panel.node.style.minHeight = "2000px";
    @panel.node.style.minWidth = "1000px";

    # Set up an observer on this view's DOM node, so that we
    # can send the MsgAfterAttach message to the @panel
    # phosphor widget, which allows it to correctly Layout
    # its children once it's attached to the DOM.
    # It is not normally required to explicitly send this message,
    # however backbone generates its view objects disconnected from
    # the DOM in order to allow bulk updates, but phosphor requires a
    # connection to document.body in order to calculate correct
    # sizes.
    @observer = new MutationObserver((mutations) =>
      for m in mutations
        do (m) =>
          if @el in m.addedNodes
            console.log("Mutation: VB ")
            console.log(m)

            window.bokeh_phosphor.sendMessage(
              @panel,
              window.bokeh_phosphor.Widget.MsgAfterAttach
            )

            for idx in [0...@panel.childCount()]
              @panel.childAt(idx).refresh()
              
            @render()
            @panel.update()
    )

    @observer.observe(document.body,
      {subtree: true,
      childList: true}
    )

    @views = {}
    @listenTo(@model, 'change', @render)

  render: () ->

    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    width = @mget("width")
    # if width? then panel.width = width
    if width? then @$el.css(minWidth: width + "px")
    height = @mget("height")
    # if height? then panel.height = height
    if height? then @$el.css(minHeight: height + "px")

    for child in children
      console.log("VBox")
      child_widget = new window.bokeh_phosphor.Widget()
      child_widget.node.style.minWidth = "1400px"
      child_widget.node.style.minHeight = "450px"
      child_widget.node.appendChild(@views[child.id].$el[0])
      # child_widget.processMessage(new window.bokeh_phosphor.ResizeMessage(400, 400))
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
