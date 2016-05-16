_ = require "underscore"

p  = require "../../core/properties"

AbstractIcon = require "./abstract_icon"
Widget = require "./widget"

class IconView extends Widget.View
  tagName: "i"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()
    @$el.addClass("bk-fa")
    @$el.addClass("bk-fa-" + @mget("icon_name"))
    size = @mget("size")
    if size? then @$el.css("font-size": size + "em")
    flip = @mget("flip")
    if flip? then @$el.addClass("bk-fa-flip-" + flip)
    if @mget("spin")
      @$el.addClass("bk-fa-spin")
    return @

  update_constraints: () ->
    null


class Icon extends AbstractIcon.Model
  type: "Icon"
  default_view: IconView

  @define {
      icon_name: [ p.String, "check" ] # TODO (bev) enum?
      size:      [ p.Number          ]
      flip:      [ p.Any             ] # TODO (bev)
      spin:      [ p.Bool,   false   ]
    }

module.exports =
  Model: Icon
  View: IconView
