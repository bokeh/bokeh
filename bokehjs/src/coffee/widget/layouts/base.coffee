_ = require "underscore"
build_views = require "../../common/build_views"
ContinuumView = require "../../common/continuum_view"
HasParent = require "../../common/has_parent"

module.exports = (type, box) ->
  class AppBoxView extends box.View

    initialize: (options) ->
      super(options)
      app = @mget('app')
      @listenTo(app, 'change:objects', @render)

  class AppBox extends HasParent
    type: type
    default_view: AppBoxView

    children: () ->
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

  return {
    Model: AppBox
    View: AppBoxView
  }
