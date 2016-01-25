_ = require "underscore"
ContinuumView = require "../common/continuum_view"
AbstractIcon = require "./abstract_icon"

class IconView extends ContinuumView
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

class Icon extends AbstractIcon.Model
  type: "Icon"
  default_view: IconView

  defaults: ->
    return _.extend {}, super(), {
      icon_name: "check"
      size: null
      flip: null
      spin: false
    }

module.exports =
  Model: Icon
  View: IconView
