import type {Document} from "../document"
import {RootAddedEvent, RootRemovedEvent, TitleChangedEvent} from "../document"
import type {DocumentChangedEvent} from "../document"
import type {HasProps} from "../core/has_props"
import type {View} from "../core/view"
import {ViewManager} from "../core/view_manager"
import {DOMView} from "../core/dom_view"
import {isString} from "../core/util/types"
import {assert} from "../core/util/assert"
import {logger} from "../core/logging"
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

export type StandaloneMountErrorHandler = (error: unknown, root_key?: string) => void

export class StandaloneRootError extends Error {
  override readonly name = "BokehStandaloneRootError"

  constructor(readonly root_key: string, override readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : `${cause}`)
  }
}

export class StandaloneMount {
  private _disposed = false
  private _on_change?: (event: DocumentChangedEvent) => void
  private readonly _on_abort = () => this.dispose()
  private readonly _render_tokens = new Map<string, symbol>()
  private readonly _root_views = new Map<string, View>()
  private readonly _targets = new Map<string, EmbedTarget>()
  private _default_target: EmbedTarget | null = null
  private _use_for_title = false

  constructor(
    readonly document: Document,
    readonly roots: Map<string, HasProps>,
    readonly dispose_document: boolean,
    readonly signal?: AbortSignal,
    readonly on_error?: StandaloneMountErrorHandler,
    readonly track_document_roots: boolean = false,
    readonly on_targets_changed?: () => void,
  ) {
    assert(document.views_manager == null)
    this.views = new ViewManager([], index)
    document.views_manager = this.views

    if (signal?.aborted == true) {
      this.dispose()
    } else {
      signal?.addEventListener("abort", this._on_abort, {once: true})
    }
  }

  readonly views: ViewManager

  get disposed(): boolean {
    return this._disposed
  }

  listen(on_change: (event: DocumentChangedEvent) => void): void {
    assert(!this._disposed)
    this._on_change = on_change
    this.document.on_change(on_change)
  }

  get root_keys(): readonly string[] {
    return [...this.roots.keys()]
  }

  get root_views(): ReadonlyMap<string, View> {
    return this._root_views
  }

  get targets(): ReadonlyMap<string, EmbedTarget> {
    return this._targets
  }

  root(key: string): HasProps | null {
    return this.roots.get(key) ?? null
  }

  view(key: string): View | null {
    return this._root_views.get(key) ?? null
  }

  target(key: string): EmbedTarget | null {
    return this._targets.get(key) ?? null
  }

  private _check_active(): void {
    if (this._disposed) {
      throw this.signal?.reason ?? new Error("mount was disposed")
    }
  }

  private _key_for(model: HasProps): string | null {
    for (const [key, root] of this.roots) {
      if (root == model) {
        return key
      }
    }
    return null
  }

  private _key_for_added_root(model: HasProps): string {
    const base = model.id
    let key = base
    let suffix = 1
    while (this.roots.has(key)) {
      key = `${base}-${suffix++}`
    }
    return key
  }

  private async _wait_for_finished(view: View): Promise<void> {
    if (view.has_finished()) {
      return
    }
    await new Promise<void>((resolve) => {
      const done = () => {
        view.finished.disconnect(done)
        view.removed.disconnect(done)
        resolve()
      }
      view.finished.connect(done)
      view.removed.connect(done)
      if (view.has_finished() || view.is_destroyed) {
        done()
      }
    })
  }

  async attach(key: string, target: EmbedTarget): Promise<View | null> {
    this._check_active()
    const model = this.roots.get(key)
    if (model == null) {
      throw new Error(`unknown Bokeh mount root '${key}'`)
    }
    if (!this.document.roots().includes(model)) {
      throw new Error(`Bokeh mount root '${key}' is no longer a document root`)
    }

    const existing = this._root_views.get(key)
    if (existing != null) {
      if (existing instanceof DOMView && this._targets.get(key) != target) {
        target.appendChild(existing.el)
      }
      this._targets.set(key, target)
      this.on_targets_changed?.()
      return existing
    }

    const token = Symbol(key)
    this._render_tokens.set(key, token)
    this._targets.set(key, target)
    if (model.default_view == null) {
      this.document.notify_idle(model)
      this.on_targets_changed?.()
      return null
    }

    let view: View | null = null
    try {
      view = await this.views.build_view(model)
      this._check_active()
      if (this._render_tokens.get(key) != token || !this.document.roots().includes(model)) {
        view.remove()
        return null
      }

      if (view instanceof DOMView) {
        view.build(target)
      }
      await view.ready
      await this._wait_for_finished(view)
      this._check_active()
      if (this._render_tokens.get(key) != token || !this.document.roots().includes(model)) {
        view.remove()
        return null
      }

      this._root_views.set(key, view)
      this.on_targets_changed?.()
      return view
    } catch (error) {
      if (this._render_tokens.get(key) == token) {
        this._render_tokens.delete(key)
        this._targets.delete(key)
        this.on_targets_changed?.()
      }
      view?.remove()
      throw error
    }
  }

  detach(key: string): void {
    this._render_tokens.delete(key)
    this._targets.delete(key)
    const view = this._root_views.get(key)
    this._root_views.delete(key)
    view?.remove()
    this.on_targets_changed?.()
  }

  async initialize(default_target: EmbedTarget | null, targets: ReadonlyMap<string, EmbedTarget>,
      use_for_title: boolean = false): Promise<void> {
    this._check_active()
    this._default_target = default_target
    this._use_for_title = use_for_title

    try {
      for (const key of this.root_keys) {
        const target = targets.get(key) ?? default_target
        if (target != null) {
          try {
            await this.attach(key, target)
          } catch (error) {
            throw new StandaloneRootError(key, error)
          }
        }
      }

      const {notifications} = this.document.config
      if (notifications != null && default_target != null) {
        const view = await this.views.build_view(notifications)
        try {
          this._check_active()
          if (view instanceof DOMView) {
            view.build(default_target)
          }
          await view.ready
        } catch (error) {
          view.remove()
          throw error
        }
      }

      if (use_for_title) {
        window.document.title = this.document.title()
      }

      this.listen((event) => {
        if (event instanceof RootAddedEvent && this.track_document_roots) {
          const key = this._key_for_added_root(event.model)
          this.roots.set(key, event.model)
          if (this._default_target != null) {
            void this.attach(key, this._default_target).catch((error) => this._report_render_error(error, key))
          }
        } else if (event instanceof RootRemovedEvent) {
          const key = this._key_for(event.model)
          if (key != null) {
            this.detach(key)
            this.roots.delete(key)
          }
        } else if (this._use_for_title && event instanceof TitleChangedEvent) {
          window.document.title = event.title
        }
      })
    } catch (error) {
      this.dispose()
      throw error
    }
  }

  private _report_render_error(error: unknown, root_key?: string): void {
    if (this._disposed) {
      return
    }
    if (this.on_error != null) {
      this.on_error(error, root_key)
    } else {
      logger.error(`failed to render a dynamically added document root: ${error}`)
    }
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
    this._render_tokens.clear()
    this.views.clear()
    this._root_views.clear()
    this._targets.clear()
    this.on_targets_changed?.()
    if (this.document.views_manager == this.views) {
      this.document.views_manager = undefined
    }
    if (this.dispose_document) {
      this.document.destroy()
    }
  }
}

/** @internal Legacy positional bridge retained only for notebook rendering. */
export async function mount_document_standalone(document: Document, element: EmbedTarget,
    options: StandaloneMountOptions = {}): Promise<StandaloneMount> {
  const {roots = [], use_for_title = false, signal, dispose_document = false} = options
  const root_map = new Map(document.roots().map((model) => [model.id, model]))
  const root_targets = new Map<string, EmbedTarget>()
  for (const [i, key] of [...root_map.keys()].entries()) {
    const target = roots[i]
    if (target != null) {
      root_targets.set(key, target)
    }
  }

  const mount = new StandaloneMount(document, root_map, dispose_document, signal, undefined, true)
  await mount.initialize(element, root_targets, use_for_title)
  return mount
}
