import {isObject} from "./core/util/types"
import {values} from "./core/util/object"
import {HasProps} from "./core/has_props"

export const overrides: {[key: string]: typeof HasProps} = {}
const _all_models: Map<string, typeof HasProps> = new Map()

export interface Models {
  (name: string): typeof HasProps
  register(name: string, model: typeof HasProps): void
  unregister(name: string): void
  register_models(models: {[key: string]: unknown} | null | undefined, force?: boolean, errorFn?: (name: string) => void): void
  registered_names(): string[]
}

export const Models = ((name: string): typeof HasProps => {
  const model = overrides[name] || _all_models.get(name)

  if (model == null) {
    throw new Error(`Model '${name}' does not exist. This could be due to a widget or a custom model not being registered before first usage.`)
  }

  return model
}) as Models

Models.register = (name, model) => {
  overrides[name] = model
}

Models.unregister = (name) => {
  delete overrides[name]
}

function is_HasProps(obj: unknown): obj is typeof HasProps {
  return isObject(obj) && (obj as any).prototype instanceof HasProps
}

Models.register_models = (models, force = false, errorFn?) => {
  if (models == null)
    return

  for (const model of values(models)) {
    if (is_HasProps(model)) {
      const qualified = model.__qualified__
      if (force || !_all_models.has(qualified))
        _all_models.set(qualified, model)
      else if (errorFn != null)
        errorFn(qualified)
      else
        console.warn(`Model '${qualified}' was already registered`)
    }
  }
}

export const register_models = Models.register_models

Models.registered_names = () => Array.from(_all_models.keys())

// TODO: this doesn't belong here, but it's easier this way for backwards compatibility
import * as AllModels from "./models"
register_models(AllModels)
