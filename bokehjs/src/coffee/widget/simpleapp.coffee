define [
  "common/has_parent",
  "common/continuum_view",
  "common/collection"
], (HasParent, ContinuumView, Collection) ->
  class SimpleAppView extends ContinuumView
    initialize : (options) ->
      super(options)
      @render()

    render : () ->
      @$el.html('')
      layout = @mget('layout')
      @layout_view = new layout.default_view(model : layout)
      @$el.append(@layout_view.$el)

  class SimpleApp extends HasParent
    type : SimpleApp
    default_view : SimpleAppView
  class SimpleApps extends Collection
    model : SimpleApp

  simpleapps = new SimpleApps()
  return {
    "Model" : SimpleApp
    "Collection" : simpleapps
    "View" : SimpleAppView
  }
