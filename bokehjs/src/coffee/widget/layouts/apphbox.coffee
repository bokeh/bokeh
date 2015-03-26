define [
  "../hbox",
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "common/collection",
  "underscore"
], (hbox, HasParent, ContinuumView, build_views, Collection, _) ->
  ##TODO
  class AppHBoxView extends hbox.View
    initialize : (options) ->
      super(options)
      app = @mget('app')
      @listenTo(app, 'change:objects', @render)

  class AppHBox extends HasParent
    type : "AppHBox"
    default_view : AppHBoxView
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

  class AppHBoxes extends Collection
    model : AppHBox
  apphboxes = new AppHBoxes()
  return {
    "Model" : AppHBox
    "Collection" : apphboxes
    "View" : AppHBoxView
  }
