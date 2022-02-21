import {isObject, isArray} from "./core/util/types"
import {values} from "./core/util/object"
import {HasProps} from "./core/has_props"
import {ModelResolver} from "./core/resolvers"

export const default_resolver = new ModelResolver(null)

function is_HasProps(obj: unknown): obj is typeof HasProps {
  return isObject(obj) && (obj as any).prototype instanceof HasProps
}

export function register_models(models: {[key: string]: unknown} | unknown[], force: boolean = false): void {
  for (const model of isArray(models) ? models : values(models)) {
    if (is_HasProps(model)) {
      default_resolver.register(model, force)
    }
  }
}
