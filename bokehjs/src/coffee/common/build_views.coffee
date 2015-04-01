_ = require "underscore"

build_views = (view_storage, view_models, options, view_types=[]) ->
  # ## function: build_views
  # convenience function for creating a bunch of views from a spec
  # and storing them in a dictionary keyed off of model id.
  # views are automatically passed the model that they represent

  # ####Parameters
  # * mainmodel: model which is constructing the views, this is used to resolve
  #   specs into other model objects
  # * view_storage: where you want the new views stored.  this is a dictionary
  #   views will be keyed by the id of the underlying model
  # * view_specs: list of view specs.  view specs are continuum references, with
  #   a typename and an id.  you can also pass options you want to feed into
  #   the views constructor here, as an 'options' field in the dict
  # * options: any additional option to be used in the construction of views
  # * view_option: array, optional view specific options passed in to the construction of the view

  created_views = []
  newmodels = _.filter(view_models, (x) -> return not _.has(view_storage, x.id))

  for model, i_model in newmodels
    view_specific_option = _.extend({}, options, {'model': model})

    if i_model < view_types.length
      view_storage[model.id] = new view_types[i_model](view_specific_option)
    else
      view_storage[model.id] = new model.default_view(view_specific_option)

    view_storage[model.id].$el.find("*[class*='ui-']").each (idx, el) ->
      el.className = jQueryUIPrefixer(el)
    created_views.push(view_storage[model.id])

  to_remove = _.difference(_.keys(view_storage), _.pluck(view_models, 'id'))

  for key in to_remove
    view_storage[key].remove()
    delete view_storage[key]

  return created_views

jQueryUIPrefixer = (el) ->
  return unless el.className?
  classList = el.className.split " "
  prefixedClassList = _.map classList, (a) ->
    a = a.trim()
    return if a.indexOf("ui-") is 0 then "bk-#{a}" else a
  return prefixedClassList.join " "

# FIXME Hack to expose jQueryUIPrefixer
build_views.jQueryUIPrefixer = jQueryUIPrefixer

# FIXME This export is the same as module.exports = build_views
module.exports =
  build_views = build_views
