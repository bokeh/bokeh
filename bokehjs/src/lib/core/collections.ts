import type {HasProps} from "./has_props"
import type {Property} from "./properties"
import {logger} from "./logging"

type PropsOf<T extends HasProps> = {
  [K in keyof T["properties"]]: T["properties"][K] extends Property<infer P> ? P : never
}

export type Many<T extends HasProps> = T[] & PropsOf<T> & {
  readonly first: T | undefined
  one(): T
}

function is_index(attr: string): boolean {
  const index = Number(attr)
  return Number.isInteger(index) && `${index}` == attr
}

function as_object(item: unknown): object {
  if ((typeof item == "object" && item != null) || typeof item == "function") {
    return item
  } else {
    throw new TypeError("Many collection items must be objects to forward attributes")
  }
}

function _many(items: unknown[]): unknown {
  Object.defineProperties(items, {
    first: {
      get: () => items[0],
    },
    one: {
      value: () => {
        if (items.length != 1) {
          throw new Error(`expected exactly one item, found ${items.length}`)
        }
        return items[0]
      },
    },
  })

  return new Proxy(items, {
    get(target, attr, receiver) {
      if (typeof attr != "string" || attr in target) {
        return Reflect.get(target, attr, receiver)
      }
      if (target.length == 0) {
        throw new Error(`Trying to access '${attr}' attribute on an empty Many collection`)
      }
      try {
        const values = target.map((item) => Reflect.get(as_object(item), attr))
        return values.length == 1 ? values[0] : _many(values)
      } catch {
        throw new Error(`Trying to access '${attr}' attribute on a Many collection, but items have no '${attr}' attribute`)
      }
    },
    set(target, attr, value, receiver) {
      if (typeof attr != "string" || attr in target || is_index(attr)) {
        return Reflect.set(target, attr, value, receiver)
      }
      if (target.length == 0) {
        logger.warn(`Setting '${attr}' on an empty Many collection has no effect`)
      }
      for (const item of target) {
        Reflect.set(as_object(item), attr, value)
      }
      return true
    },
  })
}

export function many<T extends HasProps>(items: Iterable<T>): Many<T> {
  return _many([...items]) as Many<T>
}
