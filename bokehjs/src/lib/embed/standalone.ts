import type {Document} from "../document"
import {RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import type {DocumentChangedEvent} from "../document"
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

export type StandaloneMountOptions = {
  roots?: (EmbedTarget | null)[]
  use_for_title?: boolean
  signal?: AbortSignal
  dispose_document?: boolean
}

export class StandaloneMount {
  private _disposed = false
  private _on_change?: (event: DocumentChangedEvent) => void
  private readonly _on_abort = () => this.dispose()

  constructor(
    readonly document: Document,
    readonly views: ViewManager,
    readonly dispose_document: boolean,
    readonly signal?: AbortSignal,
  ) {
    if (signal?.aborted == true) {
      this.dispose()
    } else {
      signal?.addEventListener("abort", this._on_abort, {once: true})
    }
  }

  get disposed(): boolean {
    return this._disposed
  }

  listen(on_change: (event: DocumentChangedEvent) => void): void {
    assert(!this._disposed)
    this._on_change = on_change
    this.document.on_change(on_change)
  }

  dispose(): void {
    if (this._disposed) {
      return
    }
    this._disposed = true

    this.signal?.removeEventListener("abort", this._on_abort)
    if (this._on_change != null) {
      this.document.remove_on_change(this._on_change)
      this._on_change = undefined
    }
    this.views.clear()
    if (this.document.views_manager == this.views) {
      this.document.views_manager = undefined
    }
    if (this.dispose_document) {
      this.document.destroy()
    }
  }
}

export async function mount_document_standalone(document: Document, element: EmbedTarget,
    options: StandaloneMountOptions = {}): Promise<StandaloneMount> {
  const {roots = [], use_for_title = false, signal, dispose_document = false} = options

  // This is a LOCAL index of views used only by this particular rendering.
  assert(document.views_manager == null)

  const views = new ViewManager([], index)
  document.views_manager = views
  const mount = new StandaloneMount(document, views, dispose_document, signal)

  function check_disposed(): void {
    if (mount.disposed) {
      throw signal?.reason ?? new Error("mount was disposed before rendering completed")
    }
  }

  async function render_view(model: HasProps): Promise<View> {
    check_disposed()
    const view = await views.build_view(model)
    if (mount.disposed) {
      view.remove()
      check_disposed()
    }

    if (view instanceof DOMView) {
      const i = document.all_roots.indexOf(model)
      const root_el = roots[i] ?? element
      view.build(root_el)
    }

    return view
  }

  async function render_model(model: HasProps): Promise<void> {
    if (model.default_view != null) {
      const view = await render_view(model)
      index.add(view)
    } else {
      document.notify_idle(model)
    }
  }

  function unrender_model(model: HasProps): void {
    const view = views.get(model)
    view?.remove()
  }

  try {
    check_disposed()
    for (const model of document.all_roots) {
      await render_model(model)
    }

    const {notifications} = document.config
    if (notifications != null) {
      await render_view(notifications)
    }

    if (use_for_title) {
      window.document.title = document.title()
    }

    mount.listen((event) => {
      if (event instanceof RootAddedEvent) {
        void render_model(event.model)
      } else if (event instanceof RootRemovedEvent) {
        unrender_model(event.model)
      } else if (use_for_title && event instanceof TitleChangedEvent) {
        window.document.title = event.title
      }
    })
    return mount
  } catch (error) {
    mount.dispose()
    throw error
  }
}

export async function add_document_standalone(document: Document, element: EmbedTarget,
    roots: (EmbedTarget | null)[] = [], use_for_title: boolean = false): Promise<ViewManager> {
  const mount = await mount_document_standalone(document, element, {roots, use_for_title})
  return mount.views
}
