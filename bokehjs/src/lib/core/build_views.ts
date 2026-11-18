import type {HasProps} from "./has_props"
import type {View, ViewOf} from "./view"
import type {ViewManager} from "./view_manager"
import {difference} from "./util/array"
import {assert} from "./util/assert"
import {logger} from "./logging"

export type {IterViews, ViewOf, View, ChildView} from "./view"

export type ViewStorage<T extends HasProps> = Map<T, ViewOf<T>>
export type Options<T extends View> = {
  parent: T["parent"] | null | ((obj: HasProps) => T["parent"] | null)
  owner?: ViewManager
}

function _lazy_initialize(view: View): void {
  // TODO: remove this compatibility layer for asynchronous lazy_initialize() of extensions
  const result: unknown = view.lazy_initialize()
  if (result instanceof Promise) {
    logger.warn(`${view}.lazy_initialize() is asynchronous, which is deprecated and will not be supported in the future`)
    view.schedule(async () => await result)
  }
}

export function build_view<T extends HasProps>(model: T, options: Options<ViewOf<T>> = {parent: null},
    cls: (model: T) => T["default_view"] = (model) => model.default_view): ViewOf<T> {
  const view_cls = cls(model)
  assert(view_cls != null, "model doesn't implement a view")
  const view = new view_cls({...options, model})
  try {
    view.initialize()
    _lazy_initialize(view)
    view.connect_signals()
    return view
  } catch (error) {
    view.remove()
    throw error
  }
}

export type BuildOptions<T extends HasProps> = Options<ViewOf<T>> & {
  on_error?: (error: unknown, model: T) => void
}

export type BuildResult<T extends HasProps> = {created: ViewOf<T>[], removed: ViewOf<T>[]}

const _building = new WeakSet<ViewStorage<any>>()

/**
 * Builds views for `models` into `view_storage` and removes views of models
 * that aren't wanted any more. Views of new models are added after existing
 * views, in the order of `models`.
 *
 * By default a failure throws, leaving views built so far in `view_storage`.
 * Supplying `on_error` handles failures per model and continues with the
 * remaining models. If `on_error` itself throws, building stops.
 *
 * A view's initialization must not build views into the same `view_storage`.
 */
export function build_views<T extends HasProps>(
  view_storage: ViewStorage<T>,
  models: T[],
  options: BuildOptions<T> = {parent: null},
  cls: (model: T) => T["default_view"] = (model) => model.default_view,
): BuildResult<T> {
  assert(!_building.has(view_storage), "build_views() was called reentrantly for the same views")
  _building.add(view_storage)
  try {
    const {on_error, ...view_options} = options

    const removed: ViewOf<T>[] = []
    for (const model of difference([...view_storage.keys()], models)) {
      const view = view_storage.get(model)
      if (view != null) {
        view_storage.delete(model)
        removed.push(view)
        view.remove()
      }
    }

    const created: ViewOf<T>[] = []
    for (const model of models) {
      if (view_storage.has(model)) {
        continue
      }
      try {
        const view = build_view(model, view_options, cls)
        view_storage.set(model, view)
        created.push(view)
      } catch (error) {
        if (on_error == null) {
          throw error
        }
        on_error(error, model)
      }
    }

    return {created, removed}
  } finally {
    _building.delete(view_storage)
  }
}

export function remove_views(view_storage: ViewStorage<HasProps>): void {
  for (const [model, view] of view_storage) {
    view.remove()
    view_storage.delete(model)
  }
}

export function traverse_views(views: View[], fn: (view: View) => void): void {
  const visited = new Set<View>()
  const queue: View[] = [...views]

  while (true) {
    const view = queue.shift()
    if (view === undefined) {
      break
    }
    if (visited.has(view)) {
      continue
    }
    visited.add(view)
    queue.push(...view.children_views())
    fn(view)
  }
}

/**
 * Holds at most one child view of `parent`, built from a model that may
 * change over time (e.g. a property like `Dialog.content`).
 */
export class ChildViewSlot<T extends HasProps> {
  private _view: ViewOf<T> | null = null

  constructor(readonly parent: View) {}

  /** The current view, or `null` if there is none. */
  get view(): ViewOf<T> | null {
    return this._view
  }

  /**
   * Builds a view of `model`, or clears this slot if `model` is `null`, and
   * removes the previous view. A failure leaves the previous view in place.
   *
   * Returns whether the new view is still current, because removal of the
   * previous view emits `removed` and its listeners may re-enter this slot.
   */
  build(model: T | null): boolean {
    const view = model == null ? null : build_view(model, {parent: this.parent})
    const outgoing = this._view
    this._view = view
    outgoing?.remove()
    return this._view === view
  }

  /** Removes the current view, if any. */
  remove(): void {
    const outgoing = this._view
    this._view = null
    outgoing?.remove()
  }
}
