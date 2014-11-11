define [
  "common/continuum_view"
  "common/collection",
  "common/has_parent"
], (ContinuumView, BaseCollection, HasParent) ->

  return (name) ->
    class View extends ContinuumView
      attributes:
        class: View

      initialize: (options) ->
        super(options)
        @render_init()

      render_init: () ->
        @$el.html("")

    class Model extends HasParent
      type : name.toUpperCase()
      default_view: View

    class Collection extends BaseCollection
      model : Model

    return {
      Model: Model
      Collection: new Collection()
    }
