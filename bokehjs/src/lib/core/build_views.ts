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

// Tracks, per view_storage, which models currently have a build in flight
// (so an overlapping build_views() call doesn't start a second build for
// the same model) and the most recently requested set of models (so that if
// a model stops being wanted while its view is still being built, the call
// holding that build can tear the view down once it finishes, instead of
// storing and connecting a view nobody asked for any more). Neither call
// ever awaits the other's completion, so overlapping calls can't deadlock
// each other, including when a view's own construction reenters
// build_views() on the same view_storage.
const _building = new WeakMap<ViewStorage<any>, Set<HasProps>>()
const _desired = new WeakMap<ViewStorage<any>, Set<HasProps>>()

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

  // Reserve the whole batch up front, before awaiting anything, so that an
  // overlapping build_views() call on the same view_storage sees every
  // model in this batch as already being built, not just the one whose
  // turn has come up in the loop below.
  const new_models = models.filter((model) => !view_storage.has(model) && !building.has(model))
  for (const model of new_models) {
    building.add(model)
  }

  const created_views: ViewOf<T>[] = []
  try {
    // Build views for new models one at a time, in order, fully awaiting
    // each one (including any views it recursively builds) before starting
    // the next. Some renderers and annotations read state off their
    // siblings while building (e.g. ColorBar deriving its range from an
    // associated GlyphRenderer's already-mapped data) and rely on that
    // ordering guarantee. A failure here throws immediately, before
    // building any model after the one that failed.
    for (const model of new_models) {
      const view = await _build_view(cls(model), model, options)
      if (_desired.get(view_storage)?.has(model) !== true) {
        // A later call decided this model isn't wanted any more while this
        // build was in flight. Tear it down instead of storing it. Still
        // connect it first: remove() unconditionally calls disconnect_signals(),
        // and views may assume connect_signals() already ran (e.g. by only
        // creating an observer or listener there).
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
