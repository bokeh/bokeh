_ = require "underscore"
build_views = require "../../common/build_views"
Collection = require "../../common/collection"
ContinuumView = require "../../common/continuum_view"
HasParent = require "../../common/has_parent"
vbox = require "../vbox"

class AppVBoxView extends vbox.View

  initialize: (options) ->
    super(options)
    app = @mget('app')
    @listenTo(app, 'change:objects', @render)

class AppVBox extends HasParent
  type: "AppVBox"
  default_view: AppVBoxView

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

class AppVBoxes extends Collection
  model: AppVBox

module.exports =
  Model: AppVBox
  View: AppVBoxView
  Collection: new AppVBoxes()
