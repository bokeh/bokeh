_ = require "underscore"
build_views = require "../common/build_views"
ContinuumView  = require "../common/continuum_view"
HasParent = require "../common/has_parent"

class VBoxFormView extends ContinuumView
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

class VBoxForm extends HasParent
  type: "VBoxForm"
  default_view: VBoxFormView

  defaults: ->
    return _.extend {}, super(), {
      children: []
    }

  children: () ->
    return @get('children')

module.exports =
  Model: VBoxForm
  View: VBoxFormView