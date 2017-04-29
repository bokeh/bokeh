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

  to_remove = difference(Object.keys(view_storage), (model.id for model in view_models))

  for model_id in to_remove
    view_storage[model_id].remove()
    delete view_storage[model_id]

  created_views = []
  new_models = view_models.filter((model) -> not view_storage[model.id]?)

  for model, i in new_models
    view_cls = view_types[i] ? model.default_view
    view_options = extend({model: model}, options)
    view_storage[model.id] = view = new view_cls(view_options)
    created_views.push(view)

  return created_views
