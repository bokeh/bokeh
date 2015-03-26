define [
  "../vbox",
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "common/collection",
  "underscore"
], (vbox, HasParent, ContinuumView, build_views, Collection, _) ->
  class AppVBoxView extends vbox.View
    initialize : (options) ->
      super(options)
      app = @mget('app')
      @listenTo(app, 'change:objects', @render)

  class AppVBox extends HasParent
    type : "AppVBox"
    default_view : AppVBoxView
    children : () ->
      app = @get('app')
      raw_children = @get('children')
      objects = app.get('objects')
      children = _.map(raw_children, (child) =>
        if _.isString(child)
          return @resolve_ref(objects[child])
        else
          return child
      )
      return children

  class AppVBoxes extends Collection
    model : AppVBox
  appvboxes = new AppVBoxes()
  return {
    "Model" : AppVBox
    "Collection" : appvboxes
    "View" : AppVBoxView
  }
