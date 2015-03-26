_ = require "underscore"
build_views = require "../../common/build_views"
Collection = require "../../common/collection"
ContinuumView = require "../../common/continuum_view"
HasParent = require "../../common/has_parent"
vboxform = require "../vboxform"

class AppVBoxFormView extends vboxform.View

  initialize: (options) ->
    super(options)
    app = @mget('app')
    @listenTo(app, 'change:objects', @render)

class AppVBoxForm extends HasParent
  type: "AppVBoxForm"
  default_view: AppVBoxFormView

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

class AppVBoxForms extends Collection
  model: AppVBoxForm

module.exports =
  "Model": AppVBoxForm
  "Collection": new AppVBoxForms()
  "View": AppVBoxFormView