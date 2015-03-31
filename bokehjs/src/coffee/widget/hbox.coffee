_ = require "underscore"
build_views = require "../common/build_views"
Collection = require "../common/collection"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"

jQueryUIPrefixer = (el) ->
  return unless el.className?
  classList = el.className.split " "
  prefixedClassList = _.map classList, (a) ->
    a = a.trim()
    return if a.indexOf("ui-") is 0 then "bk-#{a}" else a
  return prefixedClassList.join " "


class HBoxView extends ContinuumView
  tag: "div"
  attributes:
    class: "bk-hbox"

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
    width = @mget("width")
    if width? then @$el.css(width: width + "px")
    height = @mget("height")
    if height? then @$el.css(height: height + "px")
    for child in children
      childView = @views[child.id].$el
      childView.find("*[class*='ui-']").each (idx, el) ->
        el.className = jQueryUIPrefixer(el)
      @$el.append(childView)

    return @

class HBox extends HasParent
  type: "HBox"
  default_view: HBoxView

  defaults: ->
    return _.extend {}, super(), {
      children: []
    }

  children: () ->
    return @get('children')

class HBoxes extends Collection
  model: HBox

module.exports =
  Model: HBox
  View: HBoxView
  Collection: new HBoxes()
