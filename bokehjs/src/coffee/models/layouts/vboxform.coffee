_ = require "underscore"
build_views = require "../../common/build_views"
BokehView  = require "../../core/bokeh_view"
p = require "../../core/properties"
VBox = require "./vbox"

class VBoxFormView extends BokehView
  tagName: "form"
  attributes:
    class: "bk-widget-form"
    role: "form"

  initialize: (options) ->
    super(options)
    @views = {}
    @render()

  render: () ->
    children = @model.children()
    build_views(@views, children)
    for own key, val of @views
      val.$el.detach()
    @$el.empty()
    for child in children
      @$el.append("<br/")
      @$el.append(@views[child.id].$el)
    return @

class VBoxForm extends VBox.Model
  type: "VBoxForm"
  default_view: VBoxFormView

  children: () ->
    return @get('children')

module.exports =
  Model: VBoxForm
  View: VBoxFormView
