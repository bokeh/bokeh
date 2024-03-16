import {isObject, isArray} from "./core/util/types"
import {values} from "./core/util/object"
import {isString} from "./core/util/types"
import {HasProps} from "./core/has_props"
import {ModelResolver} from "./core/resolvers"

export const default_resolver = new ModelResolver(null)

type PropertyKey = string | symbol

export const Models = new Proxy(default_resolver, {
  get(target: ModelResolver, name: PropertyKey, receiver: unknown): unknown {
    if (isString(name)) {
      const model = target.get(name)
      if (model != null) {
        return model
      }
    }
    return Reflect.get(target, name, receiver)
  },
  has(target: ModelResolver, name: PropertyKey): boolean {
    if (isString(name)) {
      const model = target.get(name)
      if (model != null) {
        return true
      }
    }
    return Reflect.has(target, name)
  },
  ownKeys(target: ModelResolver): PropertyKey[] {
    return target.names
  },
  getOwnPropertyDescriptor(target: ModelResolver, name: PropertyKey): PropertyDescriptor | undefined {
    if (isString(name)) {
      const model = target.get(name)
      if (model != null) {
        return {configurable: true, enumerable: true, writable: false, value: model}
      }
    }
    return Reflect.getOwnPropertyDescriptor(target, name)
  },
}) as ModelResolver & {readonly [key: string]: typeof HasProps}

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
