import {difference} from "./util/array"
import {extend} from "./util/object"

export build_views = (view_storage, view_models, options, view_types=[]) ->
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
  newmodels = view_models.filter((x) -> not view_storage[x.id]?)

  for model, i_model in newmodels
    cls = view_types[i_model] ? model.default_view
    view_options = extend({model: model}, options)
    view_storage[model.id] = view = new cls(view_options)
    created_views.push(view)

  to_remove = difference(Object.keys(view_storage), (view.id for view in view_models))

  for key in to_remove
    view_storage[key].remove()
    delete view_storage[key]

  return created_views
