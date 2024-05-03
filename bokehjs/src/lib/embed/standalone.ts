import type {Document} from "../document"
import {RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import type {HasProps} from "../core/has_props"
import type {View} from "../core/view"
import {ViewManager} from "../core/view_manager"
import {DOMView} from "../core/dom_view"
import {isString} from "../core/util/types"
import {assert} from "../core/util/assert"
import type {EmbedTarget} from "./dom"

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

export async function add_document_standalone(document: Document, element: EmbedTarget,
    roots: (EmbedTarget | null)[] = [], use_for_title: boolean = false): Promise<ViewManager> {
  // this is a LOCAL index of views used only by this particular rendering
  // call, so we can remove the views we create.
  assert(document.views_manager == null)

  const views = new ViewManager([], index)
  document.views_manager = views

  async function render_view(model: HasProps): Promise<void> {
    const view = await views.build_view(model)

    if (view instanceof DOMView) {
      const i = document.roots().indexOf(model)
      const root_el = roots[i] ?? element
      view.build(root_el)
    }

    index.add(view)
  }

  async function render_model(model: HasProps): Promise<void> {
    if (model.default_view != null) {
      await render_view(model)
    } else {
      document.notify_idle(model)
    }
  }

  function unrender_model(model: HasProps): void {
    const view = views.get(model)
    view?.remove()
  }

  for (const model of document.roots()) {
    await render_model(model)
  }

  if (use_for_title) {
    window.document.title = document.title()
  }

  document.on_change((event) => {
    if (event instanceof RootAddedEvent) {
      void render_model(event.model)
    } else if (event instanceof RootRemovedEvent) {
      unrender_model(event.model)
    } else if (use_for_title && event instanceof TitleChangedEvent) {
      window.document.title = event.title
    }
  })

  return views
}
