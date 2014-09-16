define [
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "common/collection"
], (HasParent, ContinuumView, build_views, Collection) ->

  class HBoxView extends ContinuumView
    tag : "div"
    attributes:
      class : "bk-hbox"
    initialize : (options) ->
      super(options)
      @views = {}
      @render()
      @listenTo(@model, 'change', @render)
    render: () ->
      children = @mget('children')
      build_views(@views, children)
      for own key, val of @views
        val.$el.detach()
      @$el.empty()
      width = @mget("width")
      if width? then @$el.css(width: width + "px")
      height = @mget("height")
      if height? then @$el.css(height: height + "px")
      for child in children
        @$el.append(@views[child.id].$el)

  class HBox extends HasParent
    type : "HBox"
    default_view : HBoxView
    defaults: ->
      return _.extend {}, super(), {
        children: []
      }

  class HBoxes extends Collection
    model : HBox
  hboxes = new HBoxes()
  return {
    "Model" : HBox
    "Collection" : hboxes
    "View" : HBoxView
  }
