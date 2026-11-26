import type {View} from "../core/view"
import {ViewManager} from "../core/view_manager"
import {isString} from "../core/util/types"

type PropertyKey = string | symbol

// A map from the root model IDs to their views.
export const index = new Proxy(new ViewManager(), {
  get(manager: ViewManager, property: PropertyKey): unknown {
    if (isString(property)) {
      const view = manager.get_by_id(property)
      if (view != null) {
        return view
      }
    }
    return Reflect.get(manager, property)
  },
  has(manager: ViewManager, property: PropertyKey): boolean {
    if (isString(property)) {
      const view = manager.get_by_id(property)
      if (view != null) {
        return true
      }
    }
    return Reflect.has(manager, property)
  },
  ownKeys(manager: ViewManager): PropertyKey[] {
    return manager.roots.map((root) => root.model.id)
  },
  getOwnPropertyDescriptor(manager: ViewManager, property: PropertyKey): PropertyDescriptor | undefined {
    if (isString(property)) {
      const view = manager.get_by_id(property)
      if (view != null) {
        return {configurable: true, enumerable: true, writable: false, value: view}
      }
    }
    return Reflect.getOwnPropertyDescriptor(manager, property)
  },
}) as ViewManager & {readonly [key: string]: View}
