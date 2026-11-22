import {isObject, isArray} from "./core/util/types"
import {entries} from "./core/util/object"
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

type ModelCollection = {[key: string]: unknown} | unknown[]

export function register_models(models: ModelCollection, resolver: ModelResolver): void
export function register_models(models: ModelCollection, force?: boolean, resolver?: ModelResolver): void

export function register_models(models: ModelCollection, force_or_resolver: boolean | ModelResolver = false,
    resolver: ModelResolver = default_resolver): void {
  const force = typeof force_or_resolver == "boolean" ? force_or_resolver : false
  if (force_or_resolver instanceof ModelResolver) {
    resolver = force_or_resolver
  }

  const named_models = isArray(models) ? models.map((model) => [null, model] as const) : entries(models)
  for (const [name, model] of named_models) {
    if (is_HasProps(model)) {
      if (name != null) {
        model.__qualified__ = name.includes(".") || model.__module__ == null ? name : `${model.__module__}.${name}`
      }
      resolver.register(model, force)
    }
  }
}
