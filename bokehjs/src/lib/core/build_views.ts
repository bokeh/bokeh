import type {HasProps} from "./has_props"
import type {View, ViewOf} from "./view"
import type {ViewManager} from "./view_manager"
import {difference} from "./util/array"
import {assert} from "./util/assert"

export type {IterViews, ViewOf, View, ChildView} from "./view"

export type ViewStorage<T extends HasProps> = Map<T, ViewOf<T>>
export type Options<T extends View> = {
  parent: T["parent"] | null | ((obj: HasProps) => T["parent"] | null)
  owner?: ViewManager
}

async function _build_view<T extends HasProps>(view_cls: T["default_view"], model: T, options: Options<ViewOf<T>>): Promise<ViewOf<T>> {
  assert(view_cls != null, "model doesn't implement a view")
  const view = new view_cls({...options, model})
  view.initialize()
  await view.lazy_initialize()
  return view
}

export async function build_view<T extends HasProps>(model: T, options: Options<ViewOf<T>> = {parent: null},
    cls: (model: T) => T["default_view"] = (model) => model.default_view): Promise<ViewOf<T>> {
  const view = await _build_view(cls(model), model, options)
  view.connect_signals()
  return view
}

export type BuildResult<T extends HasProps> = {created: ViewOf<T>[], removed: ViewOf<T>[]}

// Per view_storage: models with a build currently in flight (so overlapping
// calls don't build the same model twice) and the most recently requested
// models (so a build that's no longer wanted, once finished, tears itself
// down instead of getting stored). Neither call awaits the other, so they
// can't deadlock each other, even if a view's construction reenters
// build_views() on the same view_storage.
const _building = new WeakMap<ViewStorage<any>, Set<HasProps>>()
const _desired = new WeakMap<ViewStorage<any>, Set<HasProps>>()

// Re-appends (delete + set, which moves a key to the end) every stored model
// in `order`, in that sequence, so Map iteration order matches it. Needed
// because a model's build can finish after a later-requested model's.
function _reorder<T extends HasProps>(view_storage: ViewStorage<T>, order: Iterable<T>): void {
  for (const model of order) {
    const view = view_storage.get(model)
    if (view != null) {
      view_storage.delete(model)
      view_storage.set(model, view)
    }
  }
}

export async function build_views<T extends HasProps>(
  view_storage: ViewStorage<T>,
  models: T[],
  options: Options<ViewOf<T>> = {parent: null},
  cls: (model: T) => T["default_view"] = (model) => model.default_view,
): Promise<BuildResult<T>> {
  _desired.set(view_storage, new Set(models))

  const to_remove = difference([...view_storage.keys()], models)

  const removed_views: ViewOf<T>[] = []
  for (const model of to_remove) {
    const view = view_storage.get(model)
    if (view != null) {
      view_storage.delete(model)
      removed_views.push(view)
      view.remove()
    }
  }

  let building = _building.get(view_storage)
  if (building == null) {
    building = new Set()
    _building.set(view_storage, building)
  }

  // Reserve the whole batch up front, before awaiting anything, so an
  // overlapping call sees every model in this batch as already building.
  const new_models = models.filter((model) => !view_storage.has(model) && !building.has(model))
  for (const model of new_models) {
    building.add(model)
  }

  const created_views: ViewOf<T>[] = []
  try {
    // Build one at a time, fully awaiting each before starting the next:
    // some renderers/annotations (e.g. ColorBar) read state off siblings
    // built earlier in the same batch. A failure throws immediately.
    for (const model of new_models) {
      const view = await _build_view(cls(model), model, options)
      if (_desired.get(view_storage)?.has(model) !== true) {
        // No longer wanted: connect then immediately remove, rather than
        // remove() alone, since some disconnect_signals() implementations
        // assume connect_signals() already ran.
        removed_views.push(view)
        view.connect_signals()
        view.remove()
        continue
      }
      view_storage.set(model, view)
      created_views.push(view)
    }
  } finally {
    for (const model of new_models) {
      building.delete(model)
    }
  }

  // Builds can finish out of request order under overlapping calls; re-sort
  // once to match the latest request.
  const desired = _desired.get(view_storage)
  if (desired != null) {
    _reorder(view_storage, desired)
  }

  for (const view of created_views) {
    view.connect_signals()
  }

  return {
    created: created_views,
    removed: removed_views,
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
