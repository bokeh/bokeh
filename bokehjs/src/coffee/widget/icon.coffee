_ = require "underscore"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class IconView extends ContinuumView
  tagName: "i"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()

    @$el.addClass("bk-fa")
    @$el.addClass("bk-fa-" + @mget("name"))

    size = @mget("size")
    if size? then @$el.css("font-size": size + "em")

    flip = @mget("flip")
    if flip? then @$el.addClass("bk-fa-flip-" + flip)

    if @mget("spin")
      @$el.addClass("bk-fa-spin")

    return @

class Icon extends HasParent
  type: "Icon"
  default_view: IconView

  defaults: ->
    return _.extend {}, super(), {
      name: ""
      size: null
      flip: null
      spin: false
    }

module.exports =
  Model: Icon
  View: IconView