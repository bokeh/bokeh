_ = require "underscore"
build_views = require "../../common/build_views"
Collection = require "../../common/collection"
ContinuumView = require "../../common/continuum_view"
HasParent = require "../../common/has_parent"
hbox = require "../hbox"

class AppHBoxView extends hbox.View

  initialize: (options) ->
    super(options)
    app = @mget('app')
    @listenTo(app, 'change:objects', @render)

class AppHBox extends HasParent
  type: "AppHBox"
  default_view: AppHBoxView

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

class AppHBoxes extends Collection
  model: AppHBox

module.exports =
  Model: AppHBox
  View: AppHBoxView
  Collection: new AppHBoxes()
