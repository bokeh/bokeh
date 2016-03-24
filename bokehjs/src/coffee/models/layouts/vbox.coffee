_ = require "underscore"
$ = require "jquery"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
p = require "../../core/properties"
BaseBox = require "./basebox"


class VBoxView extends BokehView
  tag: "div"
  attributes:
    class: "bk-vbox"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    children = @model.get("children")
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    width = @mget("width")
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height?
      @$el.css(height: height + "px")
      spacer_height = height/(children.length*2)
    else
      spacer_height = 20

    spacer = $('<div>').addClass('bk-vbox-spacer').css({height: spacer_height})
    @$el.append($(spacer))
    for child in children
      @$el.append(@views[child.id].$el)

      @$el.append($(spacer))

    return @

class VBox extends BaseBox.Model
  type: "VBox"
  default_view: VBoxView

module.exports =
  Model: VBox
  View: VBoxView
