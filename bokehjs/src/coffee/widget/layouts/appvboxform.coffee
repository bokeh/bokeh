define [
  "../vboxform",
  "common/has_parent",
  "common/continuum_view",
  "common/build_views"
  "common/collection",
  "underscore"
], (vboxform, HasParent, ContinuumView, build_views, Collection, _) ->
  class AppVBoxFormView extends vboxform.View
    initialize : (options) ->
      super(options)
      app = @mget('app')
      @listenTo(app, 'change:objects', @render)

  class AppVBoxForm extends HasParent
    type : "AppVBoxForm"
    default_view : AppVBoxFormView
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

  class AppVBoxForms extends Collection
    model : AppVBoxForm
  appvboxforms = new AppVBoxForms()
  return {
    "Model" : AppVBoxForm
    "Collection" : appvboxforms
    "View" : AppVBoxFormView
  }
