import * as models from "./models/index"
import {clone} from "./core/util/object"

export overrides = {}
_all_models = clone(models)

export Models = (name) ->
  model = overrides[name] ? _all_models[name]

  if not model?
    throw new Error("Model `#{name}' does not exist. This could be due to a widget
                     or a custom model not being registered before first usage.")

  return model

Models.register = (name, model) -> overrides[name] = model
Models.unregister = (name) -> delete overrides[name]

Models.register_models = (models, force=false, errorFn=null) ->
  return if not models?

  for own name, model of models
    if force or not _all_models.hasOwnProperty(name)
      _all_models[name] = model
    else
      errorFn?(name)

Models.registered_names = () -> Object.keys(_all_models)

# "index" is a map from the toplevel model IDs rendered by
# embed.coffee, to the view objects for those models.  It doesn't
# contain all views, only those explicitly rendered to an element
# by embed.coffee.
export index = {}
