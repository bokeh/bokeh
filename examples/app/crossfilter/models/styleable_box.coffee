_ = require "underscore"
build_views = require "common/build_views"
ContinuumView = require "common/continuum_view"
BaseBox = require "widget/basebox"

class StyleableBoxView extends ContinuumView
  tag: "div"
  attributes:
    class: "bk-vbox"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()

    css_props = @mget("css_properties")
    if css_props? then @$el.css(css_props)

    for child in children
      @$el.append(@views[child.id].$el)
    return @

class StyleableBox extends BaseBox.Model
  type: "StyleableBox"
  default_view: StyleableBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
      css_properties: {}
    }

  children: () ->
    return @get('children')

module.exports =
  Model: StyleableBox
  View: StyleableBoxView
