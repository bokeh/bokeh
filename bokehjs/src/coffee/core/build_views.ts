import {difference} from "./util/array"
import {keys, extend} from "./util/object"

export build_views = (view_storage, models, options, cls = (model) -> model.default_view) ->
  to_remove = difference(Object.keys(view_storage), (model.id for model in models))

  for model_id in to_remove
    view_storage[model_id].remove()
    delete view_storage[model_id]

  created_views = []
  new_models = models.filter((model) -> not view_storage[model.id]?)

  for model in new_models
    view_cls = cls(model)
    view_options = extend({}, options, {model: model, connect_signals: false})
    view_storage[model.id] = view = new view_cls(view_options)
    created_views.push(view)

  for view in created_views
    view.connect_signals()

  return created_views

export remove_views = (view_storage) ->
  for id in keys(view_storage)
    view_storage[id].remove()
    delete view_storage[id]
