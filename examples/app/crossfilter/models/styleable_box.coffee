_ = require "underscore"
$ = require "jquery"
build_views = require "common/build_views"
BokehView = require "core/bokeh_view"
BaseBox = require "models/layouts/basebox"

class StyleableBoxView extends BokehView
  tag: "div"
  attributes:
    class: "bk-vbox"

  initialize: (options) ->
    super(options)


    @views = {}
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->

    if @model.get('orientation') == 'horizontal' and @attributes.class != 'horizontal'
      $(@el).addClass('bk-hbox').removeClass('bk-vbox')

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
      orientation: 'vertical'
    }

  children: () ->
    return @get('children')

module.exports =
  Model: StyleableBox
  View: StyleableBoxView
