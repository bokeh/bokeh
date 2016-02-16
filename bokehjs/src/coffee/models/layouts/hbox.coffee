_ = require "underscore"
$ = require "jquery"
bp = require "bokeh-phosphor"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"


class HBoxView extends ContinuumView

  initialize: (options) ->
    super(options)

    # Create and initialise the phosphor BoxPanel
    # for this view. HBox === LeftToRight.
    @panel = new bp.bokeh_phosphor.BoxPanel()
    @panel.direction = bp.bokeh_phosphor.BoxPanel.LeftToRight
    @panel.spacing = 5

    # Inject the phosphor boxpanel's node directly into
    # backbone so that it becomes the default node for this
    # view object.
    # In this way, we save the creation of an intermediate
    # DOM node (div), which is what backbone does by default.
    @setElement(@panel.node)

    @views = {}

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
      mutations.forEach((mutation) =>
        bp.bokeh_phosphor.sendMessage(
          @panel,
          bp.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @render
        @panel.update()
      )
    )

    @observer.observe(@el,
      {
        subtree: true,
        childList: true,
        attributes: true
      }
    )

    @render()
    @listenTo(@model, 'change', @render)

  render: () ->

    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    # width = @mget("width")
    # if width? then @$el.css(width: width + "px")
    # height = @mget("height")
    # if height? then @$el.css(height: height + "px")

    for child, index in children
      console.log("Hbox :: " + index.toString())
      child_widget = new bp.bokeh_phosphor.Widget()
      child_widget.node.appendChild(@views[child.id].$el[0])
      child_widget.node.style.width = @views[child.id].$el[0].width
      child_widget.node.style.height = @views[child.id].$el[0].height
      @panel.addChild(child_widget)

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
