_ = require "underscore"
$ = require "jquery"
bokeh_phosphor = require "bokeh_phosphor"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
BaseBox = require "./basebox"


class HBoxView extends ContinuumView
  attributes:
    class: "bk-hbox"

  initialize: (options) ->
    super(options)

    # Create and initialise the phosphor BoxPanel
    # for this view. HBox === LeftToRight.
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.LeftToRight
    @panel.spacing = 5

    # Inject the phosphor boxpanel's node directly into
    # backbone so that it becomes the default node for this
    # view object.
    # options["el"] = @panel.node
    @setElement(@panel.node)

    @views = {}
    # @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    # @el = @panel.node

    @observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        # entry = {
        #   mutation: mutation,
        #   el: mutation.target,
        #   oldValue: mutation.oldValue
        # }
        # console.log('HBOX MUTATION')
        # console.log(entry)
        bokeh_phosphor.bokeh_phosphor.sendMessage(
          @panel,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        #
        @render
        @panel.update()
      )
    )

    @observer.observe(@el, {subtree: true, childList: true, attributes: true} )

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
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget();
      child_widget.node.appendChild(@views[child.id].$el[0])
      # x = debug
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
