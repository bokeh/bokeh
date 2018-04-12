import * as models from "./models/index"
import {clone} from "./core/util/object"
import {HasProps} from "./core/has_props"
import {Class} from "./core/class"

export type View = any

export const overrides: {[key: string]: Class<HasProps>} = {}
const _all_models: {[key: string]: Class<HasProps>} = clone(models) as any

export interface Models {
  (name: string): Class<HasProps>
  register(name: string, model: Class<HasProps>): void
  unregister(name: string): void
  register_models(models: {[key: string]: Class<HasProps>} | null | undefined, force?: boolean, errorFn?: (name: string) => void): void
  registered_names(): string[]
}

export const Models = ((name: string): Class<HasProps> => {
  const model = overrides[name] || _all_models[name]

  if (model == null) {
    throw new Error(`Model '${name}' does not exist. This could be due to a widget
                     or a custom model not being registered before first usage.`)
  }

  return model
}) as Models

Models.register = (name, model) => {
  overrides[name] = model
}

Models.unregister = (name) => {
  delete overrides[name]
}

Models.register_models = (models, force = false, errorFn?) => {
  if (models == null)
    return

  for (const name in models) {
    const model = models[name]

    if (force || !_all_models.hasOwnProperty(name))
      _all_models[name] = model
    else if (errorFn != null)
      errorFn(name)
    else
      console.warn(`Model '${name}' was already registered`)
  }
}

export const register_models = Models.register_models

Models.registered_names = () => Object.keys(_all_models)

// "index" is a map from the toplevel model IDs rendered by
// embed.ts, to the view objects for those models. It doesn't
// contain all views, only those explicitly rendered to an element
// by embed.ts.
export const index: {[key: string]: View} = {}
