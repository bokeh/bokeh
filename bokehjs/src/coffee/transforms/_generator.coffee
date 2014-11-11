define [
  "common/continuum_view"
  "common/collection"
  "common/has_parent"
], (ContinuumView, BaseCollection, HasParent) ->

  return (name) ->
    class View extends ContinuumView
      attributes:
        class: "#{name.toUpperCase()}View"

      initialize: (options) ->
        super(options)
        @render_init()

      render_init: () ->
        @$el.html("")

    class Model extends HasParent
      type: name
      default_view: View

    class Collection extends BaseCollection
      model: Model

    return {
      Model: Model
      Collection: new Collection()
    }
