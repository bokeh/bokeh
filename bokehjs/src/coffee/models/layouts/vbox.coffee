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
    @widget = new bokeh_phosphor.bokeh_phosphor.Widget()
    @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()

    @observer = new MutationObserver((mutations) =>
      mutations.forEach((mutation) =>
        entry = {
          mutation: mutation,
          el: mutation.target,
          oldValue: mutation.oldValue
        }
        console.log('MUTATION: ')
        console.log(entry)
        bokeh_phosphor.bokeh_phosphor.sendMessage(
          @widget,
          bokeh_phosphor.bokeh_phosphor.Widget.MsgAfterAttach
        )
        @widget.layout = @panel.layout
      )
    )
    @observer.observe(@el,
      {subtree: true,
      childList: true,
      attributes: true}
    )
    @views = {}
    # @listenTo(@$el, 'change', @nodeChange)
    # @widget = new bokeh_phosphor.bokeh_phosphor.Widget()
    # @widget.attach( @el )
    # @panel = new bokeh_phosphor.bokeh_phosphor.BoxPanel()
    # @panel.parent = @el
    # @panel.addClass("bk-vbox")
    # @panel.id = 'main'
    # @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.TopToBottom
    # @panel.spacing = 5
    @render()
    @listenTo(@model, 'change', @render)

  nodeChange: () ->

    console.log('NODE CHANGE: ')
    bokeh_phosphor.bokeh_phosphor.sendMessage(
      @widget,
      bokeh_phosphor.bokeh_phosphor.Widget.WidgetAfterAttach
    )
    @widget.layout = @panel.layout

  render: () ->

    @panel.direction = bokeh_phosphor.bokeh_phosphor.BoxPanel.TopToBottom
    @panel.spacing = 5

    children = @model.children()
    build_views(@views, children)
    # for own key, val of @views
    #   val.$el.detach()
    # @$el.empty()
    # width = @mget("width")
    # if width? then @$el.css(width: width + "px")
    # height = @mget("height")
    # if height?
    #   @$el.css(height: height + "px")
    #   spacer_height = height/(children.length*2)
    # else
    #   spacer_height = 20

    #spacer = $('<div>').addClass('bk-vbox-spacer').css({height: spacer_height})
    #@$el.append($(spacer))
    for child in children
      console.log("VBox")
      child_widget = new bokeh_phosphor.bokeh_phosphor.Widget()
      child_widget.node.appendChild(@views[child.id].$el[0])
      @panel.addChild(child_widget)

    #@panel.update()
    console.log(@$el[0])
    @el.appendChild(@widget.node)
    #


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
