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

export type BuildResult<T extends HasProps> = {current: ViewOf<T>[], created: ViewOf<T>[], removed: ViewOf<T>[]}

export async function build_views<T extends HasProps>(
  view_storage: ViewStorage<T>,
  models: T[],
  options: Options<ViewOf<T>> = {parent: null},
  cls: (model: T) => T["default_view"] = (model) => model.default_view,
): Promise<BuildResult<T>> {

  const to_remove = difference([...view_storage.keys()], models)

  const removed: ViewOf<T>[] = []
  for (const model of to_remove) {
    const view = view_storage.get(model)
    if (view != null) {
      view_storage.delete(model)
      removed.push(view)
      view.remove()
    }
  }

  const created: ViewOf<T>[] = []
  const new_models = models.filter((model) => !view_storage.has(model))

  for (const model of new_models) {
    const view = await _build_view(cls(model), model, options)
    view_storage.set(model, view)
    created.push(view)
  }

  for (const view of created) {
    view.connect_signals()
  }

  const current = models.map((model) => view_storage.get(model)!)
  return {current, created, removed}
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
